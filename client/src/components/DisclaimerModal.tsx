import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Eye, Users, DollarSign, FileText, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

interface DisclaimerModalProps {
  open: boolean;
  onAccept: () => void;
}

export default function DisclaimerModal({ open, onAccept }: DisclaimerModalProps) {
  const [isAgreed, setIsAgreed] = useState(false);

  return (
    <Dialog open={open} onOpenChange={() => {}} modal>
      <DialogContent 
        className="max-w-md max-h-[80vh] bg-gray-950 border-2 border-[#f7931a] [&>button]:hidden overflow-hidden" 
        data-testid="modal-disclaimer"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-3">
          <DialogTitle className="text-xl text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-white" />
            Important Disclaimer & Privacy Notice
          </DialogTitle>
          <DialogDescription className="text-white text-sm">
            Please read and agree to the terms below to continue
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea 
          className="max-h-[50vh] pr-2" 
          data-testid="disclaimer-content"
        >
          <div className="space-y-3 text-xs">
            {/* Critical Warning */}
            <Alert className="border-2 border-red-500 bg-red-900/30 p-2">
              <AlertTriangle className="h-3 w-3 text-red-400" />
              <AlertDescription className="text-red-300 text-xs">
                <strong>⚠️ EXPERIMENTAL PLATFORM WARNING:</strong> GBTC Mining App is a completely experimental virtual token mining simulation. You may lose all deposited funds. GBTC tokens have no guaranteed value and may become worthless. Participate only with funds you can afford to lose entirely.
              </AlertDescription>
            </Alert>

            {/* Project Identity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">Project Identity & Independence Declaration</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <p><strong>GBTC Mining Platform</strong> is an experimental virtual token mining application developed by independent blockchain developers and innovators. <strong>CRITICAL CLARIFICATIONS:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li><strong>GBTC is NOT Bitcoin</strong> - GBTC is a newly created experimental token, completely separate from Bitcoin</li>
                  <li><strong>NOT affiliated with Grayscale Bitcoin Trust (GBTC)</strong> - No connection whatsoever to any existing GBTC securities</li>
                  <li><strong>Independent Development Team</strong> - We are unregulated blockchain developers and innovators</li>
                  <li><strong>NO connection to Bitcoin Foundation</strong> - Not endorsed by or connected to any official Bitcoin entities</li>
                  <li><strong>Virtual Mining Only</strong> - No real electricity, hardware, or energy consumption involved</li>
                </ul>
                <p className="mt-1"><strong>Our Vision:</strong> Create a decentralized app-style fair mining ecosystem where users participate, engage, and receive rewards based on their contributions and what they can afford. Everything operates within the app environment only.</p>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* KYC & Data Privacy Risks */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">KYC & Data Privacy Risks</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <Alert className="border border-amber-500 bg-amber-900/20 p-2 my-2">
                  <AlertDescription className="text-amber-300 text-xs">
                    <strong>DATA SECURITY NOTICE:</strong> No platform is 100% risk-free from data breaches, hacks, or security vulnerabilities. Participate knowing data risks exist.
                  </AlertDescription>
                </Alert>
                <p><strong>Face KYC Verification Process:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li><strong>Hash-Only Storage:</strong> Face verification creates encrypted hash signatures only - NO photos or videos stored</li>
                  <li><strong>Live Detection Only:</strong> Real-time face movement verification for multi-account prevention</li>
                  <li><strong>Device Fingerprinting:</strong> Creates unique device hash identifiers to prevent duplicate accounts</li>
                  <li><strong>No Biometric Retention:</strong> Facial data processed instantly and converted to non-reversible hash codes</li>
                  <li><strong>Encrypted Transmission:</strong> All hash data transmitted via TLS encryption</li>
                </ul>
                <p><strong>Data Risks & Platform Security:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li><strong>No 100% Security Guarantee:</strong> Platform may experience data breaches, server hacks, or security vulnerabilities</li>
                  <li><strong>Database Risk:</strong> User account data, transaction history, and KYC hashes stored in databases that could be compromised</li>
                  <li><strong>Third-Party Risk:</strong> Platform uses external services that may have their own security vulnerabilities</li>
                  <li><strong>Data Breach Consequences:</strong> Personal information, transaction patterns, and account balances could be exposed</li>
                  <li><strong>Identity Verification Risks:</strong> KYC process requires personal information that carries inherent privacy risks</li>
                  <li><strong>No Insurance for Data Loss:</strong> Platform provides no insurance or compensation for data breaches or privacy violations</li>
                </ul>
                <p><strong>User Data Responsibility:</strong> By participating, you accept all data privacy risks and potential security breaches. We implement security measures but cannot guarantee complete protection.</p>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Platform Mechanics */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">Platform Mechanics & Business Model</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <p><strong>How GBTC Mining Works:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li><strong>Virtual Block-Based Mining</strong> - All mining is simulated within the app, no real energy or hardware</li>
                  <li><strong>USDT Deposits</strong> - Users deposit USDT to participate in the ecosystem</li>
                  <li><strong>Hashrate Purchases</strong> - Buy virtual hashrate within the app to earn GBTC tokens</li>
                  <li><strong>Bitcoin Time Lock & Earn</strong> - Deposit Bitcoin in time-locked positions for additional earnings</li>
                  <li><strong>In-App Revenue Model</strong> - Platform generates revenue from hashrate purchases and other in-app activities</li>
                </ul>
                <p><strong>Token Value Mechanism:</strong> GBTC token value after launch will be determined by revenue generated from in-app purchases, user engagement, platform usage, and overall community interest. <strong>NO GUARANTEED VALUE OR RETURNS.</strong></p>
                <p><strong>Staker Benefits:</strong> Time-lock BTC stakers receive income distributions from in-app purchase revenues according to our internal allocation model. <strong>Returns not guaranteed and depend on platform performance.</strong></p>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Investment & Financial Risk */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">Financial Risks & Investment Warnings</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <Alert className="border border-red-400 bg-red-900/20 p-2 my-2">
                  <AlertDescription className="text-red-300 text-xs">
                    <strong>NOT INVESTMENT ADVICE:</strong> We provide no investment, financial, or trading advice. This is experimental software. Consult qualified professionals before making any financial decisions.
                  </AlertDescription>
                </Alert>
                <p><strong>Critical Platform Risks:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li><strong>Total Loss Risk:</strong> All deposited USDT, Bitcoin, and earned GBTC tokens may become worthless</li>
                  <li><strong>No Guaranteed Profits:</strong> We make no commitments to profits, returns, or token value appreciation</li>
                  <li><strong>Experimental Nature:</strong> Platform is in experimental phase with potential bugs, failures, or complete shutdown</li>
                  <li><strong>Token Liquidity Risk:</strong> GBTC tokens may have no market or trading value after launch</li>
                  <li><strong>Revenue Dependency:</strong> Token value depends entirely on in-app purchase revenues which may be insufficient</li>
                  <li><strong>Platform Shutdown Risk:</strong> Developers may discontinue platform at any time</li>
                  <li><strong>No Insurance or Guarantees:</strong> No FDIC, SIPC, or any insurance protection</li>
                  <li><strong>Smart Contract Risk:</strong> Potential bugs or vulnerabilities in blockchain code</li>
                </ul>
                <p><strong>User Responsibility:</strong> You invest and participate entirely at your own risk and decision. You are responsible for all tax implications and regulatory compliance in your jurisdiction.</p>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Regulatory & Legal Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">Regulatory Status & Legal Framework</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <p><strong>Unregulated Experimental Platform:</strong> We are independent blockchain developers and innovators. This platform is NOT regulated by any financial authority.</p>
                <p><strong>No Regulatory Oversight:</strong> Platform operates without SEC, CFTC, FinCEN, or any regulatory approval or oversight.</p>
                <p><strong>Geographic Restrictions:</strong> Service may be unavailable in certain jurisdictions. Users must verify local legal compliance independently.</p>
                <p><strong>No Regulatory Commitments:</strong> We do not commit to compliance with future regulatory frameworks or requirements.</p>
                <p><strong>Regulatory Change Risk:</strong> Changes in cryptocurrency regulations may affect platform operations or force discontinuation.</p>
                <p><strong>Developer Protection:</strong> Platform developers disclaim responsibility for regulatory compliance issues arising from user participation.</p>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* Legal Terms & Liability */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3 text-white" />
                <h3 className="text-sm font-bold text-white">Legal Terms, Liability & User Obligations</h3>
              </div>
              <div className="text-white text-xs pl-5 space-y-1">
                <p><strong>By using this platform, you explicitly agree that:</strong></p>
                <ul className="ml-3 list-disc space-y-0.5 text-gray-300">
                  <li>You are 18+ years old and legally capable of entering binding agreements</li>
                  <li>You understand this is completely experimental with substantial financial risks</li>
                  <li>You participate entirely at your own risk and decision</li>
                  <li>You will NOT hold developers liable for any financial losses, damages, or platform failures</li>
                  <li>You accept full responsibility for regulatory compliance in your jurisdiction</li>
                  <li>You understand GBTC tokens may have zero value and provide no guaranteed returns</li>
                  <li>You acknowledge developers make no profit commitments or guarantees</li>
                  <li>You will not pursue legal action against developers for losses or platform discontinuation</li>
                  <li>You understand we are not a regulated financial services provider</li>
                </ul>
                <p><strong>Complete Liability Disclaimer:</strong> Platform developers, contributors, and affiliates disclaim all liability for any direct, indirect, incidental, special, consequential, or punitive damages arising from platform use.</p>
                <p><strong>Indemnification:</strong> You agree to indemnify and hold harmless all platform developers from any claims, legal actions, or regulatory investigations arising from your use of the service.</p>
                <p><strong>No Regulatory Assistance:</strong> Developers are not responsible for answering regulatory inquiries or providing compliance assistance related to your platform usage.</p>
                <Alert className="border border-amber-500 bg-amber-900/20 p-2 my-2">
                  <AlertDescription className="text-amber-300 text-xs">
                    <strong>Final User Acknowledgment:</strong> You confirm complete understanding that this is an experimental platform with no guaranteed outcomes. You participate with full awareness of potential total financial loss and regulatory risks. You acknowledge this disclaimer provides developers complete protection from liability.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="pt-3 border-t border-gray-800">
          <div className="flex items-center space-x-2 mb-3">
            <Checkbox
              id="agree-checkbox"
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked === true)}
              className="border-white data-[state=checked]:bg-[#f7931a] data-[state=checked]:border-[#f7931a] h-4 w-4"
              data-testid="checkbox-agree-disclaimer"
            />
            <label htmlFor="agree-checkbox" className="text-white text-xs flex items-center gap-1 cursor-pointer">
              <UserCheck className="w-3 h-3 text-white" />
              I agree to all terms and conditions above
            </label>
          </div>
          
          <div className="flex justify-center">
            <Button
              onClick={onAccept}
              disabled={!isAgreed}
              className={`px-8 transition-all duration-200 text-xs h-8 font-bold ${
                isAgreed 
                  ? "bg-[#f7931a] hover:bg-[#ff9416] text-black shadow-lg" 
                  : "bg-gray-600 text-gray-400 cursor-not-allowed"
              }`}
              data-testid="button-accept-disclaimer"
            >
              NEXT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}