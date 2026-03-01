import { useBrand } from '@/App';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function BrandSelector() {
  const { brands, selectedBrandId, setSelectedBrandId } = useBrand();

  if (brands.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Brand:</span>
        <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Brand:</span>
      <Select
        value={selectedBrandId?.toString() ?? ''}
        onValueChange={(val) => setSelectedBrandId(Number(val))}
      >
        <SelectTrigger className="w-[200px] h-9 text-sm">
          <SelectValue placeholder="Select brand" />
        </SelectTrigger>
        <SelectContent>
          {brands.map((b) => (
            <SelectItem key={b.id} value={b.id.toString()}>
              {b.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
