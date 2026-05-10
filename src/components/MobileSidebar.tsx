'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { SidebarContent, type SidebarProps } from './Sidebar';

export function MobileSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="lg:hidden rounded-full">
          <Menu width={18} height={18} />
          Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] p-0 bg-card/80 border-r border-border">
        <div className="h-full relative flex flex-col p-6 gap-6 overflow-y-auto">
          <div className="flex justify-end">
            <SheetClose asChild>
              <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Close sidebar">
                <X width={18} height={18} />
              </Button>
            </SheetClose>
          </div>
          <SidebarContent {...props} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
