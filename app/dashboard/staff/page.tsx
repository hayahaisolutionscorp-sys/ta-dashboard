"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconUserPlus,
  IconRefresh,
} from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/lib/stores/auth.store";
import { useAllAgencyStaff } from "@/hooks/queries/staff/use-agency-staff";
import { useRegisterStaff } from "@/hooks/mutations/staff/use-register-staff";
import { getErrorMessage } from "@/lib/api";

function syncStatusVariant(status: string) {
  if (status === "synced") return "default" as const;
  if (status === "pending") return "secondary" as const;
  if (status === "failed") return "destructive" as const;
  return "outline" as const;
}

function roleVariant(role: string) {
  if (role === "Admin") return "default" as const;
  return "secondary" as const;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useRegisterStaff();

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setContactNumber("");
    setAddress("");
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    registerMutation.mutate(
      {
        travel_agent_name: name,
        email,
        password,
        contact_number: contactNumber,
        address,
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        },
      },
    );
  };

  const isValid =
    name.length >= 2 &&
    email.includes("@") &&
    password.length >= 6 &&
    contactNumber.length >= 10 &&
    address.length >= 5;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <IconUserPlus className="size-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Agent</DialogTitle>
          <DialogDescription>
            Create a new Staff account for your agency. They will be able to log
            in once their account is synced.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="staff-name">Full Name</Label>
            <Input
              id="staff-name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-password">Password</Label>
            <Input
              id="staff-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-contact">Contact Number</Label>
            <Input
              id="staff-contact"
              placeholder="+63 912 345 6789"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="staff-address">Address</Label>
            <Input
              id="staff-address"
              placeholder="123 Main St, Manila, Philippines"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={registerMutation.isPending || !isValid}
          >
            {registerMutation.isPending ? "Creating..." : "Create Staff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type RoleFilter = "all" | "Staff" | "Admin";

export default function StaffPage() {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const isAdmin = currentUser?.role === "Admin";
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const {
    data: staff,
    isLoading,
    error,
    refetch,
  } = useAllAgencyStaff(isAdmin);

  // Staff users should not access this page
  if (!isAdmin) {
    router.replace("/dashboard");
    return null;
  }

  const totalStaff = staff?.length ?? 0;
  const staffCount = staff?.filter((s) => s.role === "Staff").length ?? 0;
  const adminCount = staff?.filter((s) => s.role === "Admin").length ?? 0;
  const syncedCount = staff?.filter((s) => s.sync_status === "synced").length ?? 0;
  const pendingCount = staff?.filter((s) => s.sync_status === "pending").length ?? 0;

  const filtered =
    roleFilter === "all"
      ? staff
      : staff?.filter((s) => s.role === roleFilter);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Staff Management
            </h1>
            <p className="text-muted-foreground">
              Manage agents in your travel agency
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <IconRefresh className="mr-1 h-4 w-4" />
              Refresh
            </Button>
            <AddStaffDialog />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <IconUsers className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{totalStaff}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-green-600">
                  {syncedCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Synced and ready</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Awaiting sync</p>
            </CardContent>
          </Card>
        </div>

        {/* Error state */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4 text-sm text-red-600">
              Failed to load staff: {error.message}
            </CardContent>
          </Card>
        )}

        {/* Role Filter */}
        <div className="flex gap-2">
          {([
            { key: "all", label: "All", count: totalStaff },
            { key: "Staff", label: "Staff", count: staffCount },
            { key: "Admin", label: "Admins", count: adminCount },
          ] as const).map(({ key, label, count }) => (
            <Button
              key={key}
              variant={roleFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter(key)}
            >
              {label}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </Button>
          ))}
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUsers className="size-5" />
              {roleFilter === "all"
                ? "All Agents"
                : roleFilter === "Staff"
                  ? "Staff Agents"
                  : "Admin Agents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={`skel-${i}`}
                    className="grid grid-cols-5 gap-4 py-3"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : !filtered || filtered.length === 0 ? (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <IconUsers className="mb-4 h-12 w-12 opacity-50" />
                <p className="text-lg font-medium">
                  {roleFilter === "all"
                    ? "No Agents Found"
                    : `No ${roleFilter === "Staff" ? "Staff" : "Admin"} Agents Found`}
                </p>
                <p className="text-sm">
                  {roleFilter === "all"
                    ? "Add your first staff agent to get started."
                    : "Try selecting a different filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 border-b pb-2 text-sm font-medium text-muted-foreground">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span>Created</span>
                </div>

                {/* Table Rows */}
                {filtered.map((agent) => (
                  <div
                    key={agent.id}
                    className="grid grid-cols-5 gap-4 py-3 border-b last:border-0 items-center text-sm"
                  >
                    <span className="font-medium truncate">
                      {agent.travel_agent_name}
                    </span>
                    <span className="text-muted-foreground truncate">
                      {agent.email}
                    </span>
                    <Badge variant={roleVariant(agent.role)}>
                      {agent.role}
                    </Badge>
                    <Badge variant={syncStatusVariant(agent.sync_status)}>
                      {agent.sync_status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {formatDate(agent.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
