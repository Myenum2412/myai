"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldIcon } from "lucide-react";

interface AgeVerificationProps {
  onVerified: () => void;
}

export function AgeVerification({ onVerified }: AgeVerificationProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (verified === "true") {
      setIsVerified(true);
      onVerified();
    } else {
      setShowModal(true);
    }
  }, [onVerified]);

  const handleVerify = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (isNaN(year) || year < 1900 || year > currentYear) {
      setError("Please enter a valid year");
      return;
    }

    if (age < 18) {
      setError("You must be 18 or older to use this service");
      return;
    }

    localStorage.setItem("age_verified", "true");
    setIsVerified(true);
    setShowModal(false);
    onVerified();
  };

  if (isVerified) {
    return null;
  }

  if (!showModal) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-border/50 w-full max-w-md mx-4 p-6 space-y-6 rounded-2xl shadow-2xl">
        <div className="text-center space-y-4">
          <div className="mx-auto h-12 w-12 bg-gradient-to-br from-[#0077B6] to-[#03045E] flex items-center justify-center rounded-xl">
            <ShieldIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Age Verification Required</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This content is intended for adults only. Please verify your age to continue.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Year of Birth</label>
            <Input
              type="number"
              placeholder="Enter your birth year (e.g., 1990)"
              value={birthYear}
              onChange={(e) => {
                setBirthYear(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleVerify();
              }}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>

          <Button
            onClick={handleVerify}
            className="w-full bg-gradient-to-r from-[#0077B6] to-[#005a8c] hover:from-[#005a8c] hover:to-[#03045E] text-white"
          >
            Verify Age
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By clicking &quot;Verify Age&quot;, you confirm that you are at least 18 years old.
          </p>

          <div className="text-xs text-center text-muted-foreground space-y-1 pt-2 border-t">
            <p>This app contains adult content.</p>
            <p>All conversations are private and stored locally.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
