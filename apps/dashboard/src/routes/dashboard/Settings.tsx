import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { Screen } from "../../types";
import { useTenant, useOffboard } from "../../hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { tenants, setCompanyName } from "../../api-client";
import { useAuthStore } from "../../store/auth";
import { Shell } from "../../components/Shell";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Btn } from "../../components/Btn";
import { Modal } from "../../components/Modal";
import { FormInput } from "../../components/FormInput";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/Toast";


const TIERS: Record<number, { name: string; blurb: string }> = {
  1: { name: "Starter", blurb: "$49/mo · Up to 3 seats · 25 documents" },
  2: { name: "Growth", blurb: "$149/mo · Up to 10 seats · 200 documents" },
  3: { name: "Enterprise", blurb: "Custom · Unlimited seats · Unlimited documents" },
};

export function Settings({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const offboard = useOffboard();
  const setAuthCompany = useAuthStore(s => s.setCompany);

  const [company, setCompany] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [showOffboard, setShowOffboard] = useState(false);
  const [step, setStep] = useState(1);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (tenant) {
      setCompany(tenant.companyName ?? "");
      if (tenant.companyName) setAuthCompany(tenant.companyName);
    }
  }, [tenant?.companyName, setAuthCompany]);

  const tier = tenant?.tier ? TIERS[tenant.tier] : undefined;
  const companyName = tenant?.companyName ?? "";

  const closeOffboard = () => { setShowOffboard(false); setStep(1); setTyped(""); };

  const handleSaveCompany = async () => {
    if (!company.trim()) return;
    setSavingCompany(true);
    try {
      await tenants.updateTenant(company.trim());
      setCompanyName(company.trim());
      setAuthCompany(company.trim());
      qc.invalidateQueries({ queryKey: ["tenant"] });
      toast("Company name updated successfully.");
    } catch {
      toast("Failed to update company name — please try again.");
    } finally {
      setSavingCompany(false);
    }
  };

  const confirmOffboard = async () => {
    try {
      await offboard.mutateAsync();
      toast("All Sales Engineer access has been revoked");
      closeOffboard();
    } catch {
      toast("Failed to offboard team — please try again");
    }
  };

  return (
    <Shell active="settings" onNav={onNav} onLogout={onLogout}>
      <div className="max-w-[52rem] mx-auto px-5 sm:px-8 lg:px-10 py-10">
        <PageHeader title="Settings" subtitle="Manage your company and subscription." />

        {/* Company */}
        <Card className="p-6 mb-5">
          <h2 className="text-subheading text-text-primary mb-4">Company</h2>
          <div className="space-y-4 max-w-md">
            <FormInput label="Company name" value={company} onChange={setCompany} />
            <Btn
              variant="secondary"
              size="sm"
              loading={savingCompany}
              onClick={handleSaveCompany}
            >
              Save changes
            </Btn>
          </div>
        </Card>

        {/* Current plan */}
        <Card className="p-6 mb-5">
          <h2 className="text-subheading text-text-primary mb-4">Current plan</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-text-primary text-sm">{tier?.name ?? "—"}</span>
                {tenant?.status === "active" && <Badge variant="success">Active</Badge>}
              </div>
              <div className="text-sm text-text-secondary">{tier?.blurb ?? "Loading plan…"}</div>
            </div>
            <Btn variant="secondary" size="sm" onClick={() => onNav("landing")}>Change plan</Btn>
          </div>
        </Card>

     
        <Card className="p-6 border-danger/25">
          <h2 className="text-subheading text-danger mb-1">Danger zone</h2>
          <p className="text-xs text-text-tertiary mb-4">This action is immediate and cannot be undone.</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-danger/10">
            <div>
              <div className="text-sm font-medium text-text-primary">Offboard team</div>
              <div className="text-xs text-text-tertiary mt-0.5">
                Revokes all SE access and sets your tenant to offboarded.
              </div>
            </div>
            <Btn variant="danger" size="sm" onClick={() => setShowOffboard(true)}>
              Offboard all Sales Engineers
            </Btn>
          </div>
        </Card>
      </div>

      <Modal
        open={showOffboard}
        onClose={closeOffboard}
        title={step === 1 ? "Offboard all Sales Engineers" : "Confirm offboarding"}
        footer={
          step === 1 ? (
            <>
              <Btn variant="secondary" size="sm" onClick={closeOffboard}>Cancel</Btn>
              <Btn variant="danger" size="sm" onClick={() => setStep(2)}>I understand, continue</Btn>
            </>
          ) : (
            <>
              <Btn variant="secondary" size="sm" onClick={() => { setStep(1); setTyped(""); }}>Back</Btn>
              <Btn
                variant="danger"
                size="sm"
                loading={offboard.isPending}
                disabled={typed !== companyName || !companyName}
                onClick={confirmOffboard}
              >
                Revoke all access
              </Btn>
            </>
          )
        }
      >
        {step === 1 ? (
          <div>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-danger-light flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-danger" />
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                This will immediately offboard every Sales Engineer on your team. It will:
              </p>
            </div>
            <div className="bg-danger-light border border-danger/15 rounded-lg p-4">
              <ul className="space-y-1.5">
                {[
                  "Revoke Gmail extension access for all Sales Engineers",
                  "Remove them from your team allowlist",
                  "Set your tenant status to offboarded",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[13px] text-danger">
                    <X size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-text-tertiary mt-4">
              Your client data is preserved but becomes unreachable while offboarded.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-danger-light flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-danger" />
              </div>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Type <strong className="text-text-primary font-mono">{companyName}</strong> to confirm.
              </p>
            </div>
            <FormInput
              value={typed}
              onChange={setTyped}
              placeholder={companyName}
            />
          </div>
        )}
      </Modal>
    </Shell>
  );
}
