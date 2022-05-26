import { useEffect, useState, useRef } from "react";
import PdfViewerComponentV2 from "./components/PdfViewerComponentV2";
import "./App.css";
import pspdfkit from 'pspdfkit';
const { Rect } = pspdfkit.Geometry;
const { RectangleAnnotation } = pspdfkit.Annotations;

function App() {
  // const document = "DE9rev1.pdf";
  const document = "de9c.pdf";

  const [ fieldToHighlight , setFieldToHighlight] = useState(0);
  const pdfContainerRef = useRef(null);
  const [ pspdfkitInstance, setPspdfkitInstance ] = useState();
  const [ formFields , setFormFields ] = useState([]);
  const defaultPageIdx = 0;
  const [ generatedAnnotationId, setGeneratedAnnotationId ] = useState(null);
  
  // Loads PDF
  const loadPdf = async() => {
    const container = pdfContainerRef.current;
    const loadedPdfInstance = await pspdfkit.load({
      // Container where PSPDFKit should be mounted.
      container,
      // The document to open.
      document,
      // Use the public directory URL as a base URL. PSPDFKit will download its library assets from here.
      baseUrl: `${window.location.protocol}//${window.location.host}/${process.env.PUBLIC_URL}`,
    })
    if(loadedPdfInstance){
      loadedPdfInstance.setToolbarItems([]);
      const annotationsList = await loadedPdfInstance.getAnnotations(defaultPageIdx);
      if(annotationsList.size > 0){
        const annotatedFormFields = annotationsList.toJS().sort( (a,b) => a.id-b.id )
        // .filter(annotation => (
        //   // To fetch only form fields...
        //   annotation instanceof pspdfkit.Annotations.WidgetAnnotation
        // ));
        setFormFields(annotatedFormFields);
      }
      else{
        alert('No annotations found!!');
      }
    }
    setPspdfkitInstance(loadedPdfInstance);
  };

  useEffect(() =>{
    loadPdf();
    return () => pspdfkit && pspdfkit.unload(pdfContainerRef.current);
  }, []);


  const createRectangles = ({
    pageIndex,
    left,
    top,
    width,
    height
  }) => {
    return new RectangleAnnotation({
      pageIndex,
      boundingBox: new Rect({
        left,
        top,
        width,
        height,
      })
    });
  };

  const highlightFormField = async (fieldToHighlight) => {
      const { boundingBox, pageIndex}  = formFields[fieldToHighlight];
      const [createdAnnotation] = await pspdfkitInstance.create(createRectangles({
        pageIndex,
        ...boundingBox
      }));
      setGeneratedAnnotationId(createdAnnotation.id);
  }
  const deleteHighlightedFormField = async (annotationId) => {
    await pspdfkitInstance.delete(annotationId);
  }
  useEffect( () => {
    if(formFields.length > 0 && pspdfkitInstance){
      if(generatedAnnotationId){
         deleteHighlightedFormField(generatedAnnotationId);
      }
      highlightFormField(fieldToHighlight);
    }
    
  } , [formFields ,fieldToHighlight])

  const generateFormFields = () => {
    return formFields.map( ({formFieldName , id}, idx) => {
      return(<div key={id} style={{
        display : 'flex'
      }}>
        <label>{formFieldName}</label>
        <input onClick={() => setFieldToHighlight(idx)} type="text" />
      </div>)
    });
  }

  return (
    <div className="App">
      <div className="formfields">
        { formFields.length > 0 && 
          <>
            <h3>Form fields</h3>
            {generateFormFields()}
          </>
        }
      </div>
      <div className="App-viewer">
        <PdfViewerComponentV2 pspdfkitInstance={pspdfkitInstance} pdfContainerRef={pdfContainerRef} fieldToHighlight={fieldToHighlight} document={document} />
      </div>
    </div>
  );
}

export default App;
