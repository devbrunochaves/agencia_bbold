import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Contract } from "@/modules/contracts/domain/types";

// A4, neutral professional look — deliberately NOT the BBOLD dark/yellow
// identity (§49): a legal document reads as paper, black text, generous
// margins. The contrast with the app's dark shell is intentional.
const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 64,
    fontSize: 11,
    lineHeight: 1.5,
    color: "#1a1a1a",
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 18,
    textAlign: "center",
  },
  paragraph: {
    marginBottom: 10,
    textAlign: "justify",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 64,
    right: 64,
    fontSize: 8,
    color: "#888888",
    textAlign: "center",
  },
});

export default function ContractPdfDocument({ contract }: { contract: Contract }) {
  const paragraphs = contract.contentSnapshot.split(/\n{2,}/).filter((p) => p.trim().length > 0);

  return (
    <Document title={contract.title}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{contract.title}</Text>
        <View>
          {paragraphs.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
}
