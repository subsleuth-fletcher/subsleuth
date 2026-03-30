"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, Link2, Database } from "lucide-react";

export function QuickActions() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [quickbooksDialogOpen, setQuickbooksDialogOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-3">
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Subscription
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subscription</DialogTitle>
            <DialogDescription>
              Manually add a new subscription to track.
            </DialogDescription>
          </DialogHeader>
          <AddSubscriptionForm onClose={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      <Button variant="outline" asChild>
        <Link href="/dashboard/import">
          <Upload className="w-4 h-4 mr-2" />
          Import CSV
        </Link>
      </Button>

      <Dialog open={quickbooksDialogOpen} onOpenChange={setQuickbooksDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Link2 className="w-4 h-4 mr-2" />
            Connect QuickBooks
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect QuickBooks</DialogTitle>
            <DialogDescription>
              Automatically import subscriptions from your QuickBooks account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-2">Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              QuickBooks integration is currently in development. Check back soon!
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setQuickbooksDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AddSubscriptionForm({ onClose }: { onClose: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // TODO: Implement actual subscription creation API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="vendorName" className="text-sm font-medium">
          Vendor Name
        </label>
        <Input
          id="vendorName"
          name="vendorName"
          placeholder="e.g., Slack, Figma, GitHub"
          required
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="category" className="text-sm font-medium">
          Category
        </label>
        <Select name="category" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="communication">Communication</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="dev-tools">Dev Tools</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
            <SelectItem value="crm">CRM</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="monthlyCost" className="text-sm font-medium">
            Monthly Cost ($)
          </label>
          <Input
            id="monthlyCost"
            name="monthlyCost"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="billingCycle" className="text-sm font-medium">
            Billing Cycle
          </label>
          <Select name="billingCycle" defaultValue="monthly">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="renewalDate" className="text-sm font-medium">
          Next Renewal Date
        </label>
        <Input id="renewalDate" name="renewalDate" type="date" />
      </div>

      <div className="space-y-2">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <Select name="status" defaultValue="active">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Adding..." : "Add Subscription"}
        </Button>
      </DialogFooter>
    </form>
  );
}
