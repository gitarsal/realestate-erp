"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold">RealEstate ERP/CRM Platform</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">HE Technologies</span>
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
