"use client";

/*
[개발 / 배포 메모]

- 로컬 개발 실행:
  npm run dev
  → http://localhost:3000

- 퍼블릭(배포) 업데이트 순서:
  git add .
  git commit -m "Updated"
  git push

  * GitHub main 브랜치 푸시
  * Vercel이 자동으로 재배포함 (1~3분 소요)
  
- 웹사이트 주소 : https://fire-dashboard-ecru.vercel.app
*/

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Inputs = {
  targetAssets: number; // 목표자산(원)
  currentAssets: number; // 현재 자산 (원)
  withdrawalRatePct: number; // 연 인출률 (%)
  safetyMarginPct: number; // 버퍼 (%)
  monthlyContribution: number; // 월 투자액 (원)
  annualReturnPct: number; // 연 기대수익률 (%)

};


const STORAGE_KEY = "fire_dashboard_v1";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatKRW(n: number) {
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString("ko-KR");
}

export default function Page() {
  const [inputs, setInputs] = useState<Inputs>({
    monthlyContribution: 1500000,
    annualReturnPct: 8,
    targetAssets: 825000000,
    currentAssets: 10000000,
    withdrawalRatePct: 4,
    safetyMarginPct: 10,
  });

  const [loaded, setLoaded] = useState(false);

  const [showHow, setShowHow] = useState(false);

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Inputs>;
        setInputs((prev) => ({
          monthlyContribution:
            typeof parsed.monthlyContribution === "number"
              ? parsed.monthlyContribution
              : prev.monthlyContribution,
          annualReturnPct:
            typeof parsed.annualReturnPct === "number"
              ? parsed.annualReturnPct
              : prev.annualReturnPct,
          targetAssets:
            typeof parsed.targetAssets === "number" ? parsed.targetAssets : prev.targetAssets,
          currentAssets:
            typeof parsed.currentAssets === "number" ? parsed.currentAssets : prev.currentAssets,
          withdrawalRatePct:
            typeof parsed.withdrawalRatePct === "number"
              ? parsed.withdrawalRatePct
              : prev.withdrawalRatePct,
          safetyMarginPct:
            typeof parsed.safetyMarginPct === "number" ? parsed.safetyMarginPct : prev.safetyMarginPct,
        }));
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  // Save to localStorage on change (after load)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      // ignore
    }
  }, [inputs, loaded]);

  // 버퍼 포함 목표자산(최종 목표)
const fireNumber = useMemo(() => {
  const margin = 1 + inputs.safetyMarginPct / 100;
  return inputs.targetAssets * margin;
}, [inputs.targetAssets, inputs.safetyMarginPct]);

// 목표자산에서 역산한 은퇴 후 월 생활비(버퍼 반영: 보수적으로 생활비를 낮춰 잡음)
const fireMonthlySpend = useMemo(() => {
  const rate = inputs.withdrawalRatePct / 100;
  const margin = 1 + inputs.safetyMarginPct / 100;
  if (rate <= 0 || margin <= 0) return NaN;
  return (inputs.targetAssets * rate) / 12 / margin;
}, [inputs.targetAssets, inputs.withdrawalRatePct, inputs.safetyMarginPct]);

// 연 지출(추정)
const annualSpend = useMemo(() => {
  if (!Number.isFinite(fireMonthlySpend)) return NaN;
  return fireMonthlySpend * 12;
}, [fireMonthlySpend]);

  
  const progressPct = useMemo(() => {
    if (!Number.isFinite(fireNumber) || fireNumber <= 0) return NaN;
    return (inputs.currentAssets / fireNumber) * 100;
  }, [inputs.currentAssets, fireNumber]);

  const gap = useMemo(() => {
    if (!Number.isFinite(fireNumber)) return NaN;
    return fireNumber - inputs.currentAssets;
  }, [fireNumber, inputs.currentAssets]);

  const monthsToTarget = useMemo(() => {
    if (!Number.isFinite(fireNumber) || fireNumber <= 0) return NaN;

    const target = fireNumber;
    const P0 = inputs.currentAssets;
    const PMT = inputs.monthlyContribution;

    const rAnnual = inputs.annualReturnPct / 100;
    const rMonthly = rAnnual <= -1 ? NaN : Math.pow(1 + rAnnual, 1 / 12) - 1;

    if (!Number.isFinite(rMonthly)) return NaN;
    if (P0 >= target) return 0;

    if (Math.abs(rMonthly) < 1e-12) {
      if (PMT <= 0) return Infinity;
      return Math.ceil((target - P0) / PMT);
    }

    const denom = P0 + PMT / rMonthly;
    if (denom <= 0) return Infinity;

    const rhs = (target + PMT / rMonthly) / denom;
    if (rhs <= 1) return 0;

    const n = Math.log(rhs) / Math.log(1 + rMonthly);
    if (!Number.isFinite(n)) return Infinity;

    const months = Math.ceil(n);
    return months > 2400 ? Infinity : months;
  }, [fireNumber, inputs.currentAssets, inputs.monthlyContribution, inputs.annualReturnPct]);

  const chartData = useMemo(() => {
  if (!Number.isFinite(fireNumber) || fireNumber <= 0) return [];

  const data: { year: number; assets: number; target: number }[] = [];

  const P0 = inputs.currentAssets;
  const PMT = inputs.monthlyContribution;

  const rAnnual = inputs.annualReturnPct / 100;
  const rMonthly = Math.pow(1 + rAnnual, 1 / 12) - 1;

  const wAnnual = inputs.withdrawalRatePct / 100; // 연 인출률
  const target = fireNumber;

  let assets = P0;
  let reached = assets >= target;

  const MAX_YEARS = 40; // 더 길게 보고 싶으면 80~100으로 늘려도 됨

  for (let year = 0; year <= MAX_YEARS; year++) {
    data.push({ year, assets, target });

    // 1년(12개월) 시뮬레이션
    for (let m = 0; m < 12; m++) {
      if (!reached) {
        // 목표 전: 복리 + 월 투자
        assets = assets * (1 + rMonthly) + PMT;

        if (assets >= target) reached = true;
      } else {
        // 목표 후: 복리 - 인출(자산의 연 인출률을 매달 나눠 인출)
        const withdrawMonthly = (assets * wAnnual) / 12;
        assets = assets * (1 + rMonthly) - withdrawMonthly;

        // 자산이 0 이하로 가면 더 의미 없으니 안전장치
        if (assets <= 0) {
          assets = 0;
          break;
        }
      }
    }
  }

  return data;
}, [
  inputs.currentAssets,
  inputs.monthlyContribution,
  inputs.annualReturnPct,
  inputs.withdrawalRatePct,
  fireNumber,
]);


  const yearsToTargetText = useMemo(() => {
    if (monthsToTarget === Infinity) return "달성 불가(저축/수익률 확인)";
    if (!Number.isFinite(monthsToTarget)) return "-";
    const y = Math.floor(monthsToTarget / 12);
    const m = monthsToTarget % 12;
    return `${y}년 ${m}개월`;
  }, [monthsToTarget]);

  const progressBar = useMemo(() => clamp(progressPct || 0, 0, 100), [progressPct]);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">은퇴가 하고 싶다 푸하하~ (은퇴 계산기)</h1>
          <p className="mt-2 text-sm text-gray-600">
            입력된 값은 따로 수집되지 않습니다.
          </p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            // <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold">입력</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="현재 자산 (원)"
              value={inputs.currentAssets}
              onChange={(v) => setInputs((p) => ({ ...p, currentAssets: Math.max(0, v) }))}
              hint="현재 보유 자산(예: 1억, 5천만 등)"
            />
            <Field
              label="월 투자액 (원)"
              value={inputs.monthlyContribution}
              onChange={(v) => setInputs((p) => ({ ...p, monthlyContribution: Math.max(0, v) }))}
              hint="매월 투자하는 금액"
            />
            <Field
              label="목표 자산 (원)"
              value={inputs.targetAssets}
              onChange={(v) => setInputs((p) => ({ ...p, targetAssets: Math.max(0, v) }))}
              hint="은퇴 시점 목표 금액(예: 8억, 10억 등)"
            />
            <PercentField
              label="연 기대수익률 (%)"
              value={inputs.annualReturnPct}
              onChange={(v) => setInputs((p) => ({ ...p, annualReturnPct: clamp(v, -50, 50) }))}
              hint="참고: SPY의 연평균 기대수익률은 8~12%"
            />
            <SelectField
              label="연 인출률 (%)"
              value={inputs.withdrawalRatePct}
              onChange={(v) => setInputs((p) => ({ ...p, withdrawalRatePct: v }))}
              options={[3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7]}
              hint="참고 : 은퇴 시점의 자산의 4%만 매년 사용한다면 자산은 증식하고, 6%를 매년 사용한다면 원금 가치는 보존된다."
            />
            <PercentField
              label="버퍼 (%)"
              value={inputs.safetyMarginPct}
              onChange={(v) =>
                setInputs((p) => ({ ...p, safetyMarginPct: clamp(v, 0, 100) }))
              }
              hint="예: 10 (=지출↑/수익률↓ 대비로 목표자산을 10% 추가)"
            />
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold">결과</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Stat label="연 지출" value={`${formatKRW(Math.round(annualSpend))} 원`} />
            <Stat label="목표 자산(FIRE Number)" value={`${formatKRW(fireNumber)} 원`} />
            <Stat
              label="진행률"
              value={
                Number.isFinite(progressPct) ? `${progressPct.toFixed(1)} %` : "-"
              }
            />
            <Stat label="목표까지 예상 기간" value={yearsToTargetText} />            <Stat
              label="남은 격차"
              value={Number.isFinite(gap) ? `${formatKRW(gap)} 원` : "-"}
            />
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowHow((v) => !v)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm hover:border-gray-900"
            >
              {showHow ? "계산 과정 닫기" : "계산 과정 보기"}
            </button>

            {showHow ? (
              <div className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm ring-1 ring-gray-200">
                <div className="font-semibold">목표자산(FIRE Number) 계산</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>목표 자산(입력): {formatKRW(inputs.targetAssets)} 원</li>
                  <li>버퍼: {inputs.safetyMarginPct}% → 버퍼 포함 목표자산 = {formatKRW(fireNumber)} 원</li>
                  <li>연 인출률: {inputs.withdrawalRatePct}%</li>
                  <li>은퇴 후 월 생활비(추정) = 목표자산 × 인출률 ÷ 12 ÷ (1+버퍼) = {formatKRW(fireMonthlySpend)} 원</li>
                  <li>연 지출(추정) = 월 생활비 × 12 = {formatKRW(Math.round(annualSpend))} 원</li>
                  <li>인출률: {inputs.withdrawalRatePct}%</li>
                  <li>
                    기본 목표자산 = 연 지출 ÷ (인출률) ={" "}
                    {formatKRW(annualSpend / (inputs.withdrawalRatePct / 100))} 원
                  </li>
                  <li>
                    버퍼: {inputs.safetyMarginPct}% → 최종 목표자산 = 기본 목표자산 × (1+버퍼) ={" "}
                    {formatKRW(fireNumber)} 원
                  </li>
                </ul>

                <div className="mt-4 font-semibold">목표까지 예상 기간 계산(개념)</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
                  <li>현재 자산(P0): {formatKRW(inputs.currentAssets)} 원</li>
                  <li>월 저축/투자(PMT): {formatKRW(inputs.monthlyContribution)} 원</li>
                  <li>연 기대수익률: {inputs.annualReturnPct}%</li>
                  <li>월복리 수익률 r = (1+r연)^(1/12) - 1 로 변환</li>
                  <li>매달 복리로 불린 뒤(P×(1+r)), 월 저축을 더하는 과정을 반복한다고 가정</li>
                  <li>목표자산에 도달하는 최소 개월 수를 로그식으로 계산</li>
                </ul>

                <div className="mt-4 text-xs text-gray-500">
                  주의: 이 계산은 고정 수익률/고정 저축/세금·수수료·변동성 미반영의 단순 모델입니다.
                </div>
              </div>
            ) : null}
          </div>


          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>진행률 바</span>
              <span>{Number.isFinite(progressPct) ? `${progressBar.toFixed(0)}%` : "-"}</span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-gray-900 transition-all"
                style={{ width: `${progressBar}%` }}
              />
            </div>
          </div>

          <div className="mt-5 text-xs text-gray-500">
            계산식: 버퍼 포함 목표자산 = 목표자산 × (1+버퍼),  생활비(추정) = 목표자산 × 인출률 ÷ 12 ÷ (1+버퍼)
          </div>
          
        </section>
          </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
            // <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              자산 성장 시뮬레이션
            </h3>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="year"
                    tickFormatter={(v) => `${v}년`}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 100000000).toFixed(1)}억`}
                  />
                  <Tooltip
                    formatter={(v) =>
                    `${Math.round(Number(v)).toLocaleString("ko-KR")} 원`
                    }
                    labelFormatter={(l) => `${l}년`}
                  />

                  {/* 자산 성장 곡선 */}
                  <Line
                    type="monotone"
                    dataKey="assets"
                    stroke="#111827"
                    strokeWidth={2}
                    dot={false}
                  />

                  {/* 목표 자산 수평선 */}
                  <Line
                    type="linear"
                    dataKey="target"
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              검은 선: 자산 성장 / 빨간 점선: 목표 자산
            </p>
            <p className="mt-2 text-xs text-gray-400 leading-relaxed">
            ※ 본 그래프는 고정 수익률·고정 인출을 가정한 기대값 시뮬레이션입니다.
            실제 시장에서는 변동성, 하락장 순서(Sequence Risk), 세금·비용 등에 따라
            결과가 크게 달라질 수 있습니다.
            </p>

          </div>
          </div>
        </div>

        
        <footer className="mt-8 text-xs text-gray-500">
          팁: 입력값은 자동 저장됩니다. 초기화하려면 브라우저에서 사이트 데이터(저장소)를 삭제하세요.
        </footer>
      </div>
    </main>
  );
}

function Field(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string | number;
}) {
  const { label, value, onChange, hint } = props;

  // 화면 표시용(콤마 포함)
  const displayValue =
    Number.isFinite(value) && value !== null ? value.toLocaleString("ko-KR") : "";
  const hintText =
    typeof hint === "number" ? hint.toLocaleString("ko-KR") : hint;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
        inputMode="numeric"
        value={displayValue}
        onChange={(e) => {
          // 사용자가 입력한 문자열에서 콤마/공백 제거 후 숫자로 변환
          const raw = e.target.value.replaceAll(",", "").replaceAll(" ", "");

          // 빈 칸이면 0으로(원하면 NaN으로 두는 것도 가능)
          if (raw === "") {
            onChange(0);
            return;
          }

          // 숫자 이외 문자는 제거 (예: 12a3 -> 123)
          const sanitized = raw.replaceAll(/[^0-9.-]/g, "");

          const n = Number(sanitized);
          onChange(Number.isFinite(n) ? n : 0);
        }}
        placeholder={hintText}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hintText}</p> : null}
    </div>
  );
}

function PercentField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  const { label, value, onChange, hint } = props;

  // 입력창에 표시될 "문자열" 상태
  const [text, setText] = useState<string>(Number.isFinite(value) ? String(value) : "");
  const isEditingRef = useRef(false);

  // 바깥 value가 바뀌면(예: localStorage 로드), 편집 중이 아닐 때만 동기화
  useEffect(() => {
    if (isEditingRef.current) return;
    setText(Number.isFinite(value) ? String(value) : "");
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
        inputMode="decimal"
        value={text}
        onFocus={() => {
          isEditingRef.current = true;
        }}
        onBlur={() => {
          isEditingRef.current = false;

          // blur 시점에 정규화해서 숫자로 반영
          const normalized = text.replaceAll(",", "."); // 콤마도 소수점으로 허용
          const n = Number(normalized);

          if (Number.isFinite(n)) {
            onChange(n);
            setText(String(n)); // 정규화된 값으로 표시
          } else {
            // 잘못된 입력이면 기존 숫자값으로 롤백
            setText(Number.isFinite(value) ? String(value) : "");
          }
        }}
        onChange={(e) => {
          // 입력 중에는 문자열만 관리 (중간 상태 "8." 같은 것도 허용)
          let next = e.target.value;

          // 콤마를 소수점으로 허용(키보드 습관 대응)
          next = next.replaceAll(",", ".");

          // 숫자와 점(.)만 허용
          next = next.replace(/[^0-9.]/g, "");

          // 점이 2개 이상이면 첫 번째만 유지
          const parts = next.split(".");
          if (parts.length > 2) {
            next = `${parts[0]}.${parts.slice(1).join("")}`;
          }

          setText(next);

          // 입력 중에도 "완전한 숫자"로 해석 가능하면 즉시 반영(계산 결과가 바로 바뀜)
          if (next !== "" && next !== ".") {
            const n = Number(next);
            if (Number.isFinite(n)) onChange(n);
          }
        }}
        placeholder={hint}
      />
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
  );
}

function SelectField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: number[];
  hint?: string;
}) {
  const { label, value, onChange, options, hint } = props;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-900"
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}%
          </option>
        ))}
      </select>
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
    </div>
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
