import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';

// AI服务商配置
const AI_PROVIDERS: Record<string, {
  name: string;
  baseUrl: string;
  defaultModel: string;
  testModel?: string;
}> = {
  agnes: {
    name: 'Agnes AI',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    defaultModel: 'agnes-2.0-flash',
    testModel: 'agnes-2.0-flash',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-v4-flash',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  zhipu: {
    name: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  qwen: {
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
  },
  azure: {
    name: 'Azure OpenAI',
    baseUrl: '',
    defaultModel: 'gpt-4o',
  },
};

// GET - 获取AI配置
export async function GET() {
  try {
    await requireAuth();

    const config = await prisma.systemConfig.findUnique({
      where: { key: 'ai_config' },
    });

    if (!config) {
      return success({
        provider: 'mock',
        apiKey: '',
        model: '',
        baseUrl: '',
        providers: Object.entries(AI_PROVIDERS).map(([key, value]) => ({
          id: key,
          name: value.name,
          defaultModel: value.defaultModel,
          baseUrl: value.baseUrl,
        })),
      });
    }

    const aiConfig = JSON.parse(config.value);
    return success({
      ...aiConfig,
      providers: Object.entries(AI_PROVIDERS).map(([key, value]) => ({
        id: key,
        name: value.name,
        defaultModel: value.defaultModel,
        baseUrl: value.baseUrl,
      })),
    });
  } catch (err) {
    console.error('Get AI config error:', err);
    return error(500, '获取AI配置失败', 500);
  }
}

// POST - 更新AI配置
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    if (!provider) {
      return error(422, '请选择AI服务商');
    }

    // 如果不是mock模式，需要API Key
    if (provider !== 'mock' && !apiKey) {
      return error(422, '请输入API Key');
    }

    const providerInfo = AI_PROVIDERS[provider];
    const configValue = {
      provider,
      apiKey: apiKey || '',
      model: model || providerInfo?.defaultModel || '',
      baseUrl: baseUrl || providerInfo?.baseUrl || '',
      updatedAt: new Date().toISOString(),
    };

    await prisma.systemConfig.upsert({
      where: { key: 'ai_config' },
      update: { value: JSON.stringify(configValue) },
      create: { key: 'ai_config', value: JSON.stringify(configValue) },
    });

    return success(configValue, 'AI配置已保存');
  } catch (err) {
    console.error('Update AI config error:', err);
    return error(500, '保存AI配置失败', 500);
  }
}

// PUT - 测试AI连通性（真实调用）
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { provider, apiKey, baseUrl, model } = body;

    if (provider === 'mock') {
      return success({
        success: true,
        message: '模拟模式无需测试',
        model: 'mock',
        latency: 0,
      });
    }

    if (!apiKey) {
      return error(422, '请输入API Key');
    }

    const providerInfo = AI_PROVIDERS[provider];
    const testBaseUrl = baseUrl || providerInfo?.baseUrl;
    if (!testBaseUrl) {
      return error(422, '请配置API Base URL');
    }

    const testModel = model || providerInfo?.testModel || providerInfo?.defaultModel;
    const endpoint = `${testBaseUrl}/chat/completions`;

    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: testModel,
          messages: [
            { role: 'user', content: 'Hi' },
          ],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(15000),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = `HTTP ${response.status}`;

        if (response.status === 401) {
          errorMessage = 'API Key 无效或已过期';
        } else if (response.status === 403) {
          errorMessage = 'API Key 无权限访问该模型';
        } else if (response.status === 429) {
          errorMessage = '请求频率超限，请稍后重试';
        } else if (response.status >= 500) {
          errorMessage = 'AI 服务暂时不可用，请稍后重试';
        }

        return success({
          success: false,
          message: errorMessage,
          model: testModel,
          latency,
          detail: errorText.substring(0, 200),
        });
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || '';

      return success({
        success: true,
        message: `连接成功！模型 ${testModel} 响应正常`,
        model: testModel,
        latency,
        preview: reply.substring(0, 100),
      });
    } catch (fetchErr: unknown) {
      const latency = Date.now() - startTime;
      const errMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);

      if (errMsg.includes('timeout') || errMsg.includes('abort')) {
        return success({
          success: false,
          message: '连接超时（15秒），请检查网络或 Base URL 是否正确',
          model: testModel,
          latency,
        });
      }

      return success({
        success: false,
        message: `连接失败：${errMsg}`,
        model: testModel,
        latency,
      });
    }
  } catch (err) {
    console.error('Test AI connection error:', err);
    return error(500, '测试连通性失败', 500);
  }
}
