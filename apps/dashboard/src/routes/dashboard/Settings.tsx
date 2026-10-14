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
import { tierName, tierBlurb } from "../../data/pricingTiers";




export function Settings({ onNav, onLogout }: { onNav: (s: Screen) => void; onLogout?: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const offboard = useOffboard();
  const setAuthCompany = useAuthStore(s => s.setCompany);
  const user = useAuthStore(s => s.user);

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

  const tier = tenant?.tier
    ? { name: tierName(tenant.tier), blurb: tierBlurb(tenant.tier) }
    : undefined;
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
      <div className="max-w-[72rem] mx-auto px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
        <PageHeader title="Settings" subtitle="Manage your account, plan and workspace." />

        {/* Account — Figma: label/value rows; company stays editable */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold text-text-primary mb-5">Account</h2>
          <div className="flex flex-col gap-5">
            {/* Company (editable) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-[14px] font-medium text-text-tertiary sm:w-32 shrink-0">Company</span>
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  aria-label="Company name"
                  className="flex-1 px-3.5 py-2 text-[14px] font-body bg-surface text-text-primary rounded-md border border-border focus:outline-none focus:border-border-focus focus:ring-2 focus:ring-primary/25 transition-colors"
                />
                <Btn variant="secondary" size="sm" loading={savingCompany} onClick={handleSaveCompany}>Save</Btn>
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <span className="text-[14px] font-medium text-text-tertiary sm:w-32 shrink-0">Email</span>
              <span className="text-[14px] text-text-primary">{user.email || "—"}</span>
            </div>

            {/* Plan (read-only + change) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <span className="text-[14px] font-medium text-text-tertiary sm:w-32 shrink-0">Plan</span>
              <span className="text-[14px] text-text-primary flex-1 flex items-center gap-2">
                {tier ? `${tier.name} · ${tier.blurb}` : "—"}
                {tenant?.status === "active" && <Badge variant="success">Active</Badge>}
              </span>
              <Btn variant="secondary" size="sm" onClick={() => onNav("plans")}>Change plan</Btn>
            </div>
          </div>
        </Card>

        {/* Danger Zone — Figma: red heading + 2px red-bordered action box */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--brand-iron)" }}>Danger Zone</h2>
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg"
            style={{ border: "2px solid var(--brand-iron)" }}
          >
            <div>
              <div className="text-[14px] font-semibold text-text-primary">Offboard all Sales Engineers</div>
              <div className="text-[14px] text-text-tertiary mt-1">
                Revokes all SE access and sets your tenant to offboarded. Client data is preserved but unreachable.
              </div>
            </div>
            <Btn variant="danger" size="sm" onClick={() => setShowOffboard(true)}>
              Offboard all
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
              <p className="text-[14px] text-text-secondary leading-relaxed">
                This will immediately offboard every Sales Engineer on your team. It will:
              </p>
            </div>
            <div className="border-l-2 border-danger pl-4 py-1">
              <ul className="space-y-1.5">
                {[
                  "Revoke Gmail extension access for all Sales Engineers",
                  "Remove them from your team allowlist",
                  "Set your tenant status to offboarded",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[14px] text-danger">
                    <X size={13} strokeWidth={1.5} className="mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[12px] text-text-tertiary mt-4">
              Your client data is preserved but becomes unreachable while offboarded.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-danger-light flex items-center justify-center shrink-0">
                <AlertTriangle size={18} strokeWidth={1.5} className="text-danger" />
              </div>
              <p className="text-[14px] text-text-secondary leading-relaxed">
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
