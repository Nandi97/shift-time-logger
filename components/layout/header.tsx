import React from 'react';
// import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { Breadcrumbs } from '../breadcrumbs';
import Logo from '@/public/logo.png';
// import SearchInput from '../search-input';
import { UserNav } from './user-nav';
// import { ThemeSelector } from '../theme-selector';
// import { ModeToggle } from './ThemeToggle/theme-toggle';
// import CtaGithub from './cta-github';

export default function Header() {
  return (
    <header className="shadd flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <div>
          <Image src={Logo} alt=" " height={100} width={100} />
        </div>
        <Separator orientation="vertical" className="mr-2 h-4 bg-slate-200" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-2 px-4">
        {/* <CtaGithub /> */}
        <div className="hidden md:flex">{/* <SearchInput /> */}</div>
        <UserNav />
        {/* <ModeToggle /> */}
        {/* <ThemeSelector /> */}
      </div>
    </header>
  );
}
