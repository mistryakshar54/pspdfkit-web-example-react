export default function PdfViewerComponent({
  pdfContainerRef,
}) {
  return <div ref={pdfContainerRef} style={{ width: "100%", height: "100vh" }} />;
}
