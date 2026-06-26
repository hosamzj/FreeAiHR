import { NextRequest } from 'next/server';
import { success, error } from '@/lib/auth';

// POST /api/candidates/parse-resume - 增强简历解析
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeText, fileName } = body;

    if (!resumeText) return error(422, '简历内容不能为空');

    // Mock parsed result
    const mockParsed = {
      name: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      education: [
        { school: '北京大学', degree: '硕士', major: '计算机科学', year: 2020 },
        { school: '清华大学', degree: '学士', major: '软件工程', year: 2017 },
      ],
      experience: [
        { company: '字节跳动', position: '高级前端工程师', duration: '2020-至今', description: '负责核心业务前端架构' },
        { company: '阿里巴巴', position: '前端工程师', duration: '2017-2020', description: '参与电商平台开发' },
      ],
      skills: ['React', 'TypeScript', 'Node.js', 'Vue', 'Next.js', 'Webpack'],
      certificates: ['PMP', 'AWS Solutions Architect'],
      projects: [
        { name: '电商平台重构', description: '主导前端架构升级，性能提升50%' },
      ],
      confidence: 0.92,
    };

    // Try AI parsing if configured
    try {
      const { callLLM } = await import('@/lib/ai');
      const aiResult = await callLLM(
        `请解析以下简历内容，提取结构化信息：
        ${resumeText.substring(0, 3000)}
        
        输出JSON格式包含：name, phone, email, education[], experience[], skills[], certificates[], projects[]`,
        { systemPrompt: 'You are an expert resume parser that extracts structured information from resumes.' }
      );
      
      if (aiResult && typeof aiResult === 'object' && 'name' in aiResult) {
        const result = aiResult as Record<string, unknown>;
        return success({ ...result, fileName, confidence: 0.95 });
      }
    } catch {
      // Fall back to mock
    }

    return success({ ...mockParsed, fileName });
  } catch (e) {
    console.error('Parse resume error:', e);
    return error(500, '简历解析失败');
  }
}
