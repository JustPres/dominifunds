import { WelcomeMetrics } from "@/lib/api/dashboard";

export default function WelcomeBanner({ data }: { data: WelcomeMetrics }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3D0808] to-[#A31E1E] p-8 text-white shadow-md">
      {/* Decorative pattern/glow */}
      <div className="absolute -right-20 -top-40 h-[400px] w-[400px] rounded-full bg-white/5 blur-[80px]" />
      <div className="absolute -bottom-20 right-20 h-[200px] w-[200px] rounded-full bg-white/10 blur-[60px]" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">
            Welcome back to {data.orgName}!
          </h2>
          <p className="mt-2 text-[15px] font-medium text-white/80">
            You are managing a total of {data.memberCount} active members.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6 rounded-xl bg-black/20 p-5 backdrop-blur-md">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              Overall Collection Rate
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-display text-4xl font-bold">
                {data.collectionRate}%
              </span>
              <span className="text-sm font-medium text-white/70">avg</span>
            </div>
          </div>
          
          {/* Progress Circular Indicator */}
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 36 36">
              {/* Background Circle */}
              <path
                className="text-white/20"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              {/* Progress Circle */}
              <path
                className="text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                strokeDasharray={`${data.collectionRate}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
