import { ClassSearch } from "@/components/class-search";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto py-8">
        <ClassSearch />
      </div>
    </div>
  );
}