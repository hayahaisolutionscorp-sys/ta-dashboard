"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { IconMapPin, IconArrowNarrowRight } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PortOption {
  portName: string;
  portCode: string;
}

interface PortComboboxProps {
  options: PortOption[];
  value: string; // selected port code
  onSelect: (portCode: string, portName: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

export function PortCombobox({
  options,
  value,
  onSelect,
  placeholder = "Search port...",
  id,
  disabled = false,
}: PortComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Deduplicate options by port code
  const uniqueOptions = useMemo(() => {
    const seen = new Set<string>();
    return options.filter((opt) => {
      if (seen.has(opt.portCode)) return false;
      seen.add(opt.portCode);
      return true;
    });
  }, [options]);

  // Filter options by search text
  const filtered = useMemo(() => {
    if (!search) return uniqueOptions;
    const lower = search.toLowerCase();
    return uniqueOptions.filter(
      (opt) =>
        opt.portName.toLowerCase().includes(lower) ||
        opt.portCode.toLowerCase().includes(lower),
    );
  }, [uniqueOptions, search]);

  // Compute display value: show port name when a value is selected and user is not typing
  const displayValue = useMemo(() => {
    if (isUserTyping) return search;
    if (value) {
      const match = uniqueOptions.find((o) => o.portCode === value);
      return match?.portName ?? search;
    }
    return search;
  }, [value, uniqueOptions, search, isUserTyping]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (opt: PortOption) => {
    onSelect(opt.portCode, opt.portName);
    setSearch(opt.portName);
    setIsUserTyping(false);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsUserTyping(true);
    if (!open) setOpen(true);
    // Clear selection when user types something different
    if (value) {
      onSelect("", "");
    }
  };

  const handleFocus = () => {
    setOpen(true);
    setIsUserTyping(true);
    // Clear search so all options are shown on focus; user can type to filter
    setSearch("");
    inputRef.current?.select();
  };

  return (
    <div ref={containerRef} className="relative">
      <IconMapPin className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 z-10" />
      <Input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        className="pl-9"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={() => setIsUserTyping(false)}
        disabled={disabled}
        autoComplete="off"
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt.portCode}
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left",
                value === opt.portCode && "bg-accent",
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                handleSelect(opt);
              }}
            >
              <span className="font-medium">{opt.portName}</span>
              <IconArrowNarrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{opt.portCode}</span>
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg px-3 py-2 text-sm text-muted-foreground">
          No ports found
        </div>
      )}
    </div>
  );
}
