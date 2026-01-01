import { ref, computed } from "vue";

// Propsの型定義
export interface CalendarEvent {
  date: string;
  title: string;
  clientId?: string; // ★追加: 顧客IDを持たせる
}

export interface CalendarProps {
  events: CalendarEvent[];
}

export function useCalendar(props: CalendarProps) {
  const currentDate = ref(new Date());

  const year = computed(() => currentDate.value.getFullYear());
  const month = computed(() => currentDate.value.getMonth() + 1);

  // カレンダー生成ロジック
  const calendarDays = computed(() => {
    const firstDay = new Date(year.value, month.value - 1, 1);
    const lastDay = new Date(year.value, month.value, 0);

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  });

  const prevMonth = () => {
    currentDate.value = new Date(year.value, month.value - 2, 1);
  };

  const nextMonth = () => {
    currentDate.value = new Date(year.value, month.value, 1);
  };

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${year.value}-${String(month.value).padStart(
      2,
      "0"
    )}-${String(day).padStart(2, "0")}`;
    return props.events.filter((e) => e.date === dateStr);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return (
      today.getFullYear() === year.value &&
      today.getMonth() + 1 === month.value &&
      today.getDate() === day
    );
  };

  return {
    year,
    month,
    calendarDays,
    prevMonth,
    nextMonth,
    getEventsForDay,
    isToday,
  };
}
