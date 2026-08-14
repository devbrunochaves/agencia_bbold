"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/flow/ui";
import type { Contract } from "@/modules/contracts/domain/types";

function sanitizeFileNamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function DownloadPdfButton({ contract }: { contract: Contract }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ pdf }, { default: ContractPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ContractPdfDocument"),
      ]);

      const blob = await pdf(<ContractPdfDocument contract={contract} />).toBlob();
      const url = URL.createObjectURL(blob);
      const year = new Date(contract.createdAt).getFullYear();
      const fileName = `Contrato-BBOLD-${sanitizeFileNamePart(contract.clientName)}-${year}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" icon={<Download size={16} strokeWidth={2} />} onClick={handleDownload} disabled={loading}>
      {loading ? "Gerando PDF..." : "Gerar PDF"}
    </Button>
  );
}
