"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"

// 面试方式颜色映射
const interviewMethodColors: Record<string, { bg: string; text: string; border: string }> = {
  offline: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  phone: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  teams: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  zoom: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  tencent: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  default: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30" },
}

// 面试方式图标映射
const interviewMethodIcons: Record<string, string> = {
  offline: "🏢",
  phone: "📞",
  teams: "💜",
  zoom: "🟠",
  tencent: "🔵",
  default: "📅",
}

interface Interview {
  id: string
  candidateId: string
  interviewerId: string
  type: string
  method: string
  startTime: string
  endTime: string
  location: string
  status: string
  notes: string
  candidate?: {
    name: string
    appliedPosition?: string
    position?: string
  }
  interviewer?: {
    name: string
    department?: string
  }
}

interface InterviewCalendarProps {
  interviews: Interview[]
  onInterviewClick?: (interview: Interview) => void
  onDateClick?: (date: Date) => void
}

export function InterviewCalendar({ interviews, onInterviewClick, onDateClick }: InterviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 获取当月第一天
  const firstDay = new Date(year, month, 1)
  // 获取当月最后一天
  const lastDay = new Date(year, month + 1, 0)
  // 获取第一天是星期几 (0 = Sunday)
  const startingDayOfWeek = firstDay.getDay()
  // 获取当月天数
  const daysInMonth = lastDay.getDate()

  // 生成日历网格
  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean } | null> = []
    
    // 添加上个月的空白日期
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // 添加当月的日期
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    
    return days
  }, [year, month, startingDayOfWeek, daysInMonth])

  // 按日期分组面试
  const interviewsByDate = useMemo(() => {
    const grouped: Record<string, Interview[]> = {}
    
    interviews.forEach((interview) => {
      const date = new Date(interview.startTime)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(interview)
    })
    
    return grouped
  }, [interviews])

  // 获取指定日期的面试
  const getInterviewsForDate = (date: Date): Interview[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return interviewsByDate[key] || []
  }

  // 判断是否是今天
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  // 切换月份
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // 格式化月份显示
  const formatMonthYear = () => {
    return `${year}年${month + 1}月`
  }

  // 处理面试点击
  const handleInterviewClick = (e: React.MouseEvent, interview: Interview) => {
    e.stopPropagation()
    if (onInterviewClick) {
      onInterviewClick(interview)
    } else {
      setSelectedInterview(interview)
    }
  }

  // 处理日期点击
  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date)
    }
  }

  // 获取面试方式颜色
  const getMethodColor = (method: string) => {
    return interviewMethodColors[method] || interviewMethodColors.default
  }

  // 获取面试方式图标
  const getMethodIcon = (method: string) => {
    return interviewMethodIcons[method] || interviewMethodIcons.default
  }

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden">
      {/* 日历头部 */}
      <div className="flex items-center justify-between border-b border-[#1e293b] p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0a0e1a] text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0a0e1a] text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-semibold text-white ml-2">
            {formatMonthYear()}
          </h2>
        </div>
        <button
          onClick={goToToday}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0a0e1a] px-3 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          今天
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b border-[#1e293b]">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-slate-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="min-h-[100px] border-b border-r border-[#1e293b] bg-[#0a0e1a]/50" />
          }

          const { date } = day
          const dayInterviews = getInterviewsForDate(date)
          const maxVisible = 3
          const visibleInterviews = dayInterviews.slice(0, maxVisible)
          const hiddenCount = dayInterviews.length - maxVisible

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] border-b border-r border-[#1e293b] p-1 transition-colors hover:bg-[#1a2236]/50 cursor-pointer",
                isToday(date) && "bg-sky-500/5"
              )}
              onClick={() => handleDateClick(date)}
            >
              {/* 日期数字 */}
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                isToday(date)
                  ? "bg-sky-500 text-white font-semibold"
                  : "text-slate-400"
              )}>
                {date.getDate()}
              </div>

              {/* 面试条目 */}
              <div className="mt-1 space-y-0.5">
                {visibleInterviews.map((interview) => {
                  const colors = getMethodColor(interview.method)
                  const icon = getMethodIcon(interview.method)
                  return (
                    <div
                      key={interview.id}
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] border cursor-pointer transition-opacity hover:opacity-80",
                        colors.bg,
                        colors.text,
                        colors.border
                      )}
                      onClick={(e) => handleInterviewClick(e, interview)}
                      title={`${interview.candidate?.name || '候选人'} - ${interview.method}`}
                    >
                      <span>{icon}</span>
                      <span className="truncate">{interview.candidate?.name || '候选人'}</span>
                    </div>
                  )
                })}
                {hiddenCount > 0 && (
                  <div className="text-[10px] text-slate-500 px-1">
                    +{hiddenCount} 更多
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 颜色图例 */}
      <div className="flex flex-wrap items-center gap-3 border-t border-[#1e293b] p-3">
        <span className="text-xs text-slate-500">面试方式：</span>
        {Object.entries(interviewMethodColors).filter(([key]) => key !== 'default').map(([method, colors]) => (
          <div key={method} className="flex items-center gap-1">
            <span className={cn("h-2 w-2 rounded-full", colors.bg.replace('/20', ''))} />
            <span className="text-[10px] text-slate-400">
              {interviewMethodIcons[method]} {method === 'offline' ? '线下' : method === 'phone' ? '电话' : method === 'teams' ? 'Teams' : method === 'zoom' ? 'Zoom' : method === 'tencent' ? '腾讯会议' : method}
            </span>
          </div>
        ))}
      </div>

      {/* 面试详情模态框 */}
      <Modal
        isOpen={!!selectedInterview}
        onClose={() => setSelectedInterview(null)}
        title="面试详情"
        size="md"
      >
        {selectedInterview && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">候选人</p>
                <p className="text-sm text-white">{selectedInterview.candidate?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">应聘职位</p>
                <p className="text-sm text-white">{selectedInterview.candidate?.appliedPosition || selectedInterview.candidate?.position || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">面试官</p>
                <p className="text-sm text-white">{selectedInterview.interviewer?.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">面试方式</p>
                <p className="text-sm text-white">{selectedInterview.method}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">开始时间</p>
                <p className="text-sm text-white">{new Date(selectedInterview.startTime).toLocaleString('zh-CN')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">结束时间</p>
                <p className="text-sm text-white">{new Date(selectedInterview.endTime).toLocaleString('zh-CN')}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">地点/链接</p>
                <p className="text-sm text-white">{selectedInterview.location || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">状态</p>
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                  selectedInterview.status === 'scheduled' ? 'bg-sky-500/10 text-sky-400' :
                  selectedInterview.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                  selectedInterview.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                  'bg-slate-500/10 text-slate-400'
                )}>
                  {selectedInterview.status === 'scheduled' ? '待面试' :
                   selectedInterview.status === 'completed' ? '已完成' :
                   selectedInterview.status === 'cancelled' ? '已取消' : selectedInterview.status}
                </span>
              </div>
            </div>
            {selectedInterview.notes && (
              <div>
                <p className="text-xs text-slate-500">备注</p>
                <p className="text-sm text-white mt-1">{selectedInterview.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

// 移动端简化版日历
export function InterviewCalendarMobile({ interviews, onInterviewClick, onDateClick }: InterviewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const getMethodColor = (method?: string): { bg: string; text: string; border: string } => {
    const m = method?.toLowerCase() || ''
    if (m.includes('线下') || m.includes('offline')) return { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' }
    if (m.includes('电话') || m.includes('phone')) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' }
    if (m.includes('teams')) return { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' }
    if (m.includes('zoom')) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' }
    if (m.includes('腾讯') || m.includes('tencent')) return { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' }
    return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  }

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startingDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const calendarDays = useMemo(() => {
    const days: Array<{ date: Date; isCurrentMonth: boolean } | null> = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }
    return days
  }, [year, month, startingDayOfWeek, daysInMonth])

  const interviewsByDate = useMemo(() => {
    const grouped: Record<string, Interview[]> = {}
    interviews.forEach((interview) => {
      const date = new Date(interview.startTime)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(interview)
    })
    return grouped
  }, [interviews])

  const getInterviewsForDate = (date: Date): Interview[] => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    return interviewsByDate[key] || []
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const formatMonthYear = () => `${year}年${month + 1}月`

  const selectedDateInterviews = selectedDate ? getInterviewsForDate(selectedDate) : []

  return (
    <div className="rounded-xl border border-[#1e293b] bg-[#111827] overflow-hidden sm:hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b border-[#1e293b] p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1e293b] text-slate-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold text-white">
            {formatMonthYear()}
          </h2>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#1e293b] text-slate-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => setCurrentDate(new Date())}
          className="text-xs text-sky-400"
        >
          今天
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 border-b border-[#1e293b]">
        {["日", "一", "二", "三", "四", "五", "六"].map((day) => (
          <div key={day} className="p-1.5 text-center text-[10px] text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 - 简化版 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={index} className="aspect-square border-b border-r border-[#1e293b]" />
          }

          const { date } = day
          const dayInterviews = getInterviewsForDate(date)
          const hasInterviews = dayInterviews.length > 0

          return (
            <div
              key={index}
              className={cn(
                "aspect-square border-b border-r border-[#1e293b] flex flex-col items-center justify-center relative",
                isToday(date) && "bg-sky-500/10"
              )}
              onClick={() => {
                if (hasInterviews) {
                  setSelectedDate(date)
                } else if (onDateClick) {
                  onDateClick(date)
                }
              }}
            >
              <span className={cn(
                "text-xs",
                isToday(date) ? "text-sky-400 font-semibold" : "text-slate-400"
              )}>
                {date.getDate()}
              </span>
              {hasInterviews && (
                <div className="absolute bottom-1 flex gap-0.5">
                  {dayInterviews.slice(0, 3).map((interview) => {
                    const colors = getMethodColor(interview.method)
                    return (
                      <div
                        key={interview.id}
                        className={cn("h-1 w-1 rounded-full", colors.bg.replace('/20', ''))}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 选中日期的面试列表 */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 面试安排` : ''}
        size="md"
      >
        {selectedDateInterviews.length > 0 ? (
          <div className="space-y-2">
            {selectedDateInterviews.map((interview) => (
              <div
                key={interview.id}
                className="rounded-lg border border-[#1e293b] bg-[#0a0e1a] p-3 cursor-pointer hover:border-sky-500/30"
                onClick={() => {
                  setSelectedDate(null)
                  if (onInterviewClick) {
                    onInterviewClick(interview)
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white">{interview.candidate?.name || '候选人'}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(interview.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {interview.method} · {interview.interviewer?.name || '-'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">当日无面试安排</p>
            <button
              onClick={() => {
                setSelectedDate(null)
                if (onDateClick && selectedDate) {
                  onDateClick(selectedDate)
                }
              }}
              className="mt-3 flex items-center gap-1.5 mx-auto rounded-lg bg-sky-500 px-3 py-1.5 text-xs text-white hover:bg-sky-600"
            >
              <Plus className="h-3 w-3" />
              新建面试
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
