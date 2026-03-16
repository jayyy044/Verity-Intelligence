"use client";

import Image from "next/image";
import favicon from "@/app/favicon.ico";

export default function Logo() {

  return (
    <div className="flex items-center gap-0">
      <div
        className="w-[46px] h-[46px] p-0 relative bg-transparent flex items-center justify-center overflow-hidden shrink-0"
      >
        <Image
          src={favicon}
          alt=""
          fill
          className="object-contain"
        />
      </div>
      <div
        className={`font-[var(--font-ibm-plex-mono)] text-[20px] font-normal tracking-[-1.9px]`}
      >
        Verity <span className="text-[var(--gold)]">Intelligence</span>
      </div>
    </div>
  );
}
