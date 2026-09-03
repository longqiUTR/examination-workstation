import { NavTabs } from "@/components/nav-tabs";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full pb-16 md:pb-0">
      <NavTabs />
      <div className="flex-1">{children}</div>
    </div>
  );
}
