"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

// 고정비 프리셋 정의 (금액, 타이틀, 설명)
const FIXED_COST_PRESETS = [
  {
    value: 1000000,
    label: "100만 원",
    title: "숨만 쉬는 미니멀형",
    desc: "가성비 원룸 월세(또는 전세대출 이자), 알뜰폰 요금, 필수 공과금과 최소한의 실손보험만 유지하는 초미니멀 라이프 수준입니다.",
  },
  {
    value: 1500000,
    label: "150만 원",
    title: "일반적인 실속형",
    desc: "평범한 수도권 주거 비용을 감당하며, 적당한 보장성 보험과 넷플릭스 등 몇 개의 구독 서비스까지 무리 없이 유지하는 표준적인 직장인 수준입니다.",
  },
  {
    value: 2000000,
    label: "200만 원",
    title: "여유로운 독립형",
    desc: "인프라가 좋은 오피스텔 주거비를 커버하고, 든든한 종합 보험 구성 및 다양한 디지털 구독 서비스까지 넉넉하게 누리는 수준입니다.",
  },
  {
    value: 2500000,
    label: "255만 원",
    title: "프리미엄 싱글형",
    desc: "넓은 주거 공간을 확보하거나 차량 유지비가 고정적으로 지출되며, 고품질의 주거 환경과 고정 지출을 지향하는 풍족한 수준입니다.",
  },
];

function formatKRW(n: number) {
  if (!Number.isFinite(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR");
}

export default function ExpenseTrackerPage() {
  // 1. 고정비 상태 (초기값: 150만 원 프리셋)
  const [fixedCost, setFixedCost] = useState(1500000);

  // 2. 월간 변동 지출 상태
  const [foodExpense, setFoodExpense] = useState(600000); // 식비
  const [leisureExpense, setLeisureExpense] = useState(400000); // 여가/쇼핑/교통 등

  // 3. 연간 비정기 지출 상태 (매달 분산 반영할 항목들)
  const [annualMedical, setAnnualMedical] = useState(1200000); // 연 의료비 (기본 월 10만 원 꼴)
  const [annualEvents, setAnnualEvents] = useState(1800000); // 연 경조사비/선물 (기본 월 15만 원 꼴)

  // 연간 비용을 월로 환산
  const monthlyMedical = useMemo(() => annualMedical / 12, [annualMedical]);
  const monthlyEvents = useMemo(() => annualEvents / 12, [annualEvents]);

  // 최종 한 달 필요 생활비 역추적 계산
  const totalMonthlyBudget = useMemo(() => {
    return fixedCost + foodExpense + leisureExpense + monthlyMedical + monthlyEvents;
  }, [fixedCost, foodExpense, leisureExpense, monthlyMedical, monthlyEvents]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        
        {/* 헤더 */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">월 생활비 역추적 계산기</h1>
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← 메뉴로
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            💡 1인 가구 기준 · 가족 파이어족 요소를 제외한 싱글 라이프 맞춤형 추정치입니다.
          </p>
        </header>

        {/* 🏆 최상단 핵심 결과 UI */}
        <section className="mb-6 rounded-2xl bg-gray-900 p-6 text-white shadow-md">
          <p className="text-sm font-medium text-gray-400">파이어 은퇴 후 추정 결과</p>
          <h2 className="mt-2 text-xl font-medium sm:text-2xl">
            당신은 한 달에 <span className="font-bold text-emerald-400">{formatKRW(totalMonthlyBudget)}원</span>을 필요로 합니다!
          </h2>
          <p className="mt-3 text-xs text-gray-400 leading-relaxed">
            ※ 매달 나가는 숨은 고정비와 가끔 발생하는 비정기 지출(의료비·경조사)을 모두 한 달 단위로 쪼개어 정밀하게 역산한 금액입니다.
          </p>
        </section>

        <div className="space-y-6">
          {/* 단계 1: 고정비 선택 (프리셋 형태) */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-base font-semibold">1. 주거 및 숨만 쉬어도 나가는 돈 (고정비)</h3>
            <p className="mt-1 text-xs text-gray-500">주거비, 통신비, 보험료, 정기 구독 서비스 등을 포함한 대략적인 규모를 선택하세요.</p>
            
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {FIXED_COST_PRESETS.map((preset) => {
                const isSelected = fixedCost === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setFixedCost(preset.value)}
                    className={`flex flex-col text-left p-4 rounded-xl ring-1 transition-all ${
                      isSelected
                        ? "bg-gray-900 text-white ring-gray-900 shadow-sm"
                        : "bg-gray-50 text-gray-900 ring-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold">{preset.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isSelected ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-700"}`}>
                        {preset.label}
                      </span>
                    </div>
                    <p className={`mt-2 text-xs leading-relaxed ${isSelected ? "text-gray-300" : "text-gray-600"}`}>
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 단계 2: 월간 변동 지출 */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-base font-semibold">2. 매달 유동적인 생활 비용 (변동 지출)</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumInput
                label="월 평균 식비 (원)"
                value={foodExpense}
                onChange={setFoodExpense}
                hint="외식, 배달, 장보기, 카페/디저트 포함"
              />
              <NumInput
                label="월 품위유지 및 여가비 (원)"
                value={leisureExpense}
                onChange={setLeisureExpense}
                hint="교통비, 쇼핑, 문화생활, 유흥/술자리 등"
              />
            </div>
          </section>

          {/* 단계 3: 연간 비정기 지출 (분산 반영 항목) */}
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">3. 1년 단위 굵직한 비용 (비정기 지출 분산)</h3>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">자동 1/12 분산 반영</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">목돈이 나가는 항목들을 연간 총액으로 입력하면 한 달 지출로 환산하여 조용히 합산합니다.</p>
            
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <NumInput
                label="연간 예상 의료비/검진비 (원)"
                value={annualMedical}
                onChange={setAnnualMedical}
                hint={`연간 총 ${formatKRW(annualMedical)}원 → 월 ${formatKRW(monthlyMedical)}원 환산`}
              />
              <NumInput
                label="연간 경조사비 및 선물 비용 (원)"
                value={annualEvents}
                onChange={setAnnualEvents}
                hint={`연간 총 ${formatKRW(annualEvents)}원 → 월 ${formatKRW(monthlyEvents)}원 환산`}
              />
            </div>
          </section>
        </div>

        <footer className="mt-8 text-center text-xs text-gray-400">
          싱글 파이어족의 현실적인 자산 계획을 위한 생활비 인덱스 시뮬레이터
        </footer>
      </div>
    </main>
  );
}

// 재사용 가능한 숫자 입력 필드 컴포넌트
function NumInput(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const { label, value, onChange, hint } = props;

  const displayValue = Number.isFinite(value) ? value.toLocaleString("ko-KR") : "";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900 transition-all"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          const raw = e.target.value.replaceAll(",", "").replaceAll(" ", "");
          if (raw === "") return onChange(0);
          const sanitized = raw.replace(/[^0-9]/g, "");
          const n = Number(sanitized);
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}
