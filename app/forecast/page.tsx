"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatKRW(n: number) {
  if (!Number.isFinite(n)) return "-";
  return Math.round(n).toLocaleString("ko-KR");
}

export default function ForecastPage() {
  const [currentAssets, setCurrentAssets] = useState(100000000);
  const [monthlyContribution, setMonthlyContribution] = useState(1500000);
  const [annualReturnPct, setAnnualReturnPct] = useState(8);
  const [durationValue, setDurationValue] = useState(10); // 기간 숫자 (예: 10)
  const [durationUnit, setDurationUnit] = useState<"months" | "years">("years"); // 단위

  const months = useMemo(() => {
    const v = Math.max(0, durationValue);
    return durationUnit === "years" ? Math.round(v * 12) : Math.round(v);
  }, [durationValue, durationUnit]);


  const futureValue = useMemo(() => {
    const P0 = currentAssets;
    const PMT = monthlyContribution;
    const rAnnual = annualReturnPct / 100;

    if (!Number.isFinite(P0) || !Number.isFinite(PMT) || !Number.isFinite(rAnnual)) return NaN;
    if (months <= 0) return P0;

    const rMonthly = rAnnual <= -1 ? NaN : Math.pow(1 + rAnnual, 1 / 12) - 1;
    if (!Number.isFinite(rMonthly)) return NaN;

    // r=0 특수 케이스
    if (Math.abs(rMonthly) < 1e-12) return P0 + PMT * months;

    // FV = P0*(1+r)^n + PMT * (( (1+r)^n - 1 ) / r )
    const growth = Math.pow(1 + rMonthly, months);
    return P0 * growth + PMT * ((growth - 1) / rMonthly);
  }, [currentAssets, monthlyContribution, annualReturnPct, months]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-3xl p-6">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">예상 자산 계산</h1>
            <Link href="/" className="text-sm text-gray-600 hover:underline">
              ← 메뉴로
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            단순 가정(고정 수익률·고정 납입) 기반의 기대값 계산입니다.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold">입력</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <NumField label="현재 자산 (원)" value={currentAssets} onChange={setCurrentAssets} />
            <NumField label="월 납입금 (원)" value={monthlyContribution} onChange={setMonthlyContribution} />
            <div>
        <label className="block text-sm font-medium text-gray-700">납입 기간</label>

        <div className="mt-1 flex gap-2">
            <input
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
                inputMode="decimal"
                value={String(durationValue)}
                onChange={(e) => {
                  const raw = e.target.value.replaceAll(",", ".").replace(/[^0-9.]/g, "");
                  if (raw === "") return setDurationValue(0);
                  const n = Number(raw);
                  setDurationValue(Number.isFinite(n) ? n : 0);
                 }}
             />

        <select
           className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
           value={durationUnit}
           onChange={(e) => setDurationUnit(e.target.value as "months" | "years")}
         >
           <option value="months">개월</option>
           <option value="years">년</option>
         </select>
        </div>

         <p className="mt-1 text-xs text-gray-500">
           계산에는 {months.toLocaleString("ko-KR")}개월로 적용됩니다.
         </p>
        </div>

            <NumField label="연 기대수익률 (%)" value={annualReturnPct} onChange={(v) => setAnnualReturnPct(clamp(v, -50, 50))} decimal />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold">결과</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Stat label="예상 최종 자산" value={`${formatKRW(futureValue)} 원`} />
            <Stat label="총 납입액" value={`${formatKRW(monthlyContribution * months)} 원`} />
          </div>

          <div className="mt-4 text-xs text-gray-500 leading-relaxed">
            ※ 주의: 실제 시장은 변동성이 있어 결과가 달라질 수 있습니다(세금·수수료·수익률 변동 미반영).
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-200">
      <div className="text-xs text-gray-600">{props.label}</div>
      <div className="mt-1 text-base font-semibold">{props.value}</div>
    </div>
  );
}

function NumField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  decimal?: boolean;
}) {
  const { label, value, onChange, decimal } = props;

  const display = Number.isFinite(value)
    ? decimal
      ? String(value)
      : Math.round(value).toLocaleString("ko-KR")
    : "";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
        inputMode={decimal ? "decimal" : "numeric"}
        value={display}
        onChange={(e) => {
          const raw = e.target.value.replaceAll(",", "").replaceAll(" ", "");
          if (raw === "") return onChange(0);

          const sanitized = decimal ? raw.replace(/[^0-9.]/g, "") : raw.replace(/[^0-9]/g, "");
          const n = Number(sanitized);
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
    </div>
  );
}
