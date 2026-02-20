"use client";

import {
  IconHelp,
  IconBook,
  IconMessageCircle,
  IconMail,
  IconPhone,
  IconSearch,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const faqItems = [
  {
    question: "How do I create a new booking?",
    answer:
      "Navigate to the Book Trip page and follow the step-by-step wizard to select routes, add passengers, and complete payment.",
  },
  {
    question: "Can I modify an existing booking?",
    answer:
      "Yes, you can modify bookings from the Bookings page. Click on the booking you want to change and select the modification option.",
  },
  {
    question: "How do I view my commission rates?",
    answer:
      "Your commission rates are displayed on the Rates page. You can see the breakdown of fares and your earnings per booking.",
  },
  {
    question: "What payment methods are supported?",
    answer:
      "We support cash, credit/debit cards, GCash, and Maya for passenger payments.",
  },
  {
    question: "How do I cancel a booking?",
    answer:
      "Go to the Bookings page, find the booking you want to cancel, and click the cancel button. Note that cancellation policies may apply.",
  },
];

export default function HelpPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-muted-foreground">
            Find answers to common questions or contact our support team
          </p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search for help topics..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <IconBook className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Documentation</CardTitle>
              <CardDescription>
                Browse our comprehensive guides and tutorials
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">View Docs</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <IconMessageCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Live Chat</CardTitle>
              <CardDescription>
                Chat with our support team in real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Start Chat</Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <IconMail className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Email Support</CardTitle>
              <CardDescription>
                Send us an email and we&apos;ll respond within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">Send Email</Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconHelp className="h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Quick answers to common questions about using the booking system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <h3 className="font-medium">{item.question}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Reach out to us through any of these channels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <IconPhone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone Support</p>
                  <p className="text-muted-foreground text-sm">
                    +63 (2) 8XXX-XXXX
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <IconMail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground text-sm">
                    support@ayahay.com
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
