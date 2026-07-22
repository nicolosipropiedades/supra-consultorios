import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
<header className="w-full bg-[linear-gradient(90deg,#a5a5a5_0%,#b0b0b0_45%,#bfbfbf_100%)] shadow-md">      <div className="flex h-24 w-full items-center px-8">
        <Link href="/" className="flex items-center gap-5">
          <Image
            src="/supra-logo-header.png"
            alt="SupRA Consultorios"
            width={190}
            height={80}
            priority
            className="h-auto w-[190px]"
          />

          <div className="hidden sm:block leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
              Centro interdisciplinario
            </p>
            <p className="text-2xl font-bold text-white">
              SupRA Consultorios
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}