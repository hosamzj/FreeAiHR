import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { success, error, requireAuth } from '@/lib/auth';
import { generateAIContent } from '@/lib/ai';

// POST - 生成JD
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { positionName, department, experience, salaryRange, skills, industry } = body;

    if (!positionName) {
      return error(422, '请输入岗位名称');
    }

    // 构建提示词
    const prompt = `请为以下职位生成一份完整的职位描述(JD)：

职位名称：${positionName}
所属行业：${industry || '未指定'}
所属部门：${department || '未指定'}
工作经验要求：${experience || '不限'}
薪资范围：${salaryRange ? `${salaryRange.min}K-${salaryRange.max}K` : '面议'}
${skills && skills.length > 0 ? `技能要求：${skills.join('、')}` : ''}

请生成以下内容：
1. 岗位职责（5-8条）
2. 任职要求（5-8条）
3. 加分项（3-5条）
4. 福利待遇（3-5条）

请用JSON格式返回，包含以下字段：
{
  "responsibilities": ["职责1", "职责2", ...],
  "requirements": ["要求1", "要求2", ...],
  "niceToHave": ["加分项1", "加分项2", ...],
  "benefits": ["福利1", "福利2", ...]
}`;

    const result = await generateAIContent(prompt);
    
    // 尝试解析JSON
    let jdData;
    try {
      // 尝试从返回内容中提取JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jdData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch {
      // 如果解析失败，返回模拟数据
      jdData = {
        responsibilities: [
          `负责${positionName}相关的设计、开发和维护工作`,
          '参与产品需求评审，提供技术方案建议',
          '编写高质量的技术文档和代码注释',
          '与团队成员协作，确保项目按时交付',
          '持续优化系统性能和用户体验',
        ],
        requirements: [
          `具备${experience || '相关'}领域工作经验`,
          '熟悉相关技术栈和开发工具',
          '良好的沟通能力和团队协作精神',
          '具备独立解决问题的能力',
          '有责任心，能承受一定的工作压力',
        ],
        niceToHave: [
          '有大型项目经验',
          '熟悉敏捷开发流程',
          '有开源项目贡献经验',
        ],
        benefits: [
          '竞争力的薪资待遇',
          '完善的五险一金',
          '弹性工作制',
          '年度体检和团建活动',
          '专业的培训和发展机会',
        ],
      };
    }

    return success({
      positionName,
      department,
      experience,
      salaryRange,
      skills,
      ...jdData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Generate JD error:', err);
    return error(500, '生成JD失败', 500);
  }
}
