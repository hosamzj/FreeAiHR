'use client';

import { FileSpreadsheet } from 'lucide-react';
import ExcelImportSection from '@/components/excel-import-section';

export default function CollectionPage() {
  return (
    <div className="space-y-4 md:space-y-5">
      {/* Page Title */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-white">简历采集</h1>
        <p className="mt-0.5 text-xs text-slate-500">通过 Excel 表格批量导入候选人简历</p>
      </div>

      {/* Excel Import */}
      <ExcelImportSection />
    </div>
  );
}
