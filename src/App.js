import React, { useState, useRef } from 'react';
import { FaCloudUploadAlt } from "react-icons/fa";
import './App.css';
import { FileDrop } from 'react-file-drop';
import ReactWordcloud from 'react-wordcloud';
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import Loader from 'react-loader-spinner';
import swal from 'sweetalert';

var pdfjsLib = require("pdfjs-dist/es5/build/pdf.js");
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.bootcss.com/pdf.js/2.5.207/pdf.worker.js";
var mammoth = require("mammoth");

function App() {
  const [paragraph, setParagraph] = useState(null);
  const [words, setWords] = useState([]);
  const [maxWords, setMaxWords] = useState(250);
  const [previewDisplay, setPreviewDisplay] = useState(false);
  const [loader, setLoader] = useState(false);
  const refFileUpload = useRef(null);
  const options = {
    rotationAngles: [0, 0],
    rotations: 0,
    transitionDuration: 500,
    spiral: "rectangular",
    fontSizes: [25, 25],
    padding: 1,
    scale: "log",
    // enableOptimizations: true,
    enableTooltip: true,
    fontFamily: "Impact"
  };
  const setWordsCloud = (strings) => {
    setParagraph(strings);
    strings = strings.replace(/[.•,]/g, '');
    var array = [];
    var wordHash = {};

    strings.split(" ").forEach((string, index) => {
      // string = string.replace(/[-.,_/:;\s]/g, '');
      string = string.replace(/[.,_/:;\s]/g, '');
      if (string && !wordHash[string.toLowerCase()]) {
        wordHash[string.toLowerCase()] = true;
        array.push({ text: string, value: 1 });
      } else if (string && wordHash[string.toLowerCase()]) {
        const index = array.findIndex(({ text }) => string.toLowerCase() === text.toLowerCase());
        if (index !== -1) {
          const data = array[index];
          array[index] = { ...data, value: data.value + 1 };
        }
      }
    });
    setWords(array);
  }

  const clearWordsCloud = () => {
    setWords([]);
    setParagraph("");
  }
  const uploadFile = (event, files) => {
    if (!files.length) {
      return;
    }
    var FileSize = files[0].size / 1024 / 1024; // in MB
    if (FileSize > 100) {
      swal("Error!", "Please upload file less than 100MB", "error");
      clearWordsCloud();
      return;
    }
    if (!["pdf", "docs", "doc", ".txt"].some((format) => files[0].name.includes(format))) {
      clearWordsCloud();
      swal("Error!", "Please upload file that has format pdf, docx etc", "error");
      return;
    }
    setLoader(true);
    var reader = new FileReader();
    reader.onload = event => {
      var data = reader.result;
      var array = new Int8Array(data);
      if (files[0].name.includes(".docx")) {
        mammoth.extractRawText({ arrayBuffer: data }).then(function (resultObject) {
          setWordsCloud(resultObject.value);
        })
      }
      else if (files[0].name.includes(".pdf")) {
        pdfjsLib.getDocument(array).promise.then(async loadedPdf => {
          let strings = "";
          for (let index = 0; index < loadedPdf.numPages; index++) {
            let page1 = await loadedPdf.getPage(index + 1);
            let content = await page1.getTextContent();
            content.items.forEach((item) => {
              strings += item.str;
            });
          }
          setWordsCloud(strings);
        })
      }
    };
    reader.onloadend = event => {
      setLoader(false);
    }
    reader.readAsArrayBuffer(files[0]);
  }

  const handleSetWordsNumber = (e) => {
    if (e.key === 'Enter') {
      setMaxWords(e.target.value || 250)
    }
  }

  const fileDrop = (e, files) => {
    e.preventDefault();
    uploadFile(e, files);
  }
  return (
    <div className="container">
      <div style={{
        width: "100%", height: 500
      }}>
        < ReactWordcloud words={words} options={options} maxWords={maxWords} />
      </div>

      <hr />
      <div className="fields-container">
        <div >
          <span>Spiral: </span>
          <input type="radio" name="spiral" id="archimedean" value="archimedean" checked disabled readOnly />
          <label htmlFor="archimedean">archimedean</label>
          <input type="radio" name="spiral" id="rectangular" value="rectangular" disabled readOnly />
          <label htmlFor="rectangular">rectangular</label>
        </div>
        <div>
          <input type="text" style={{ width: '60px' }} readOnly value="0" />
          <span> orientations from </span>
          <input type="number" style={{ width: '60px' }} readOnly value="0" />
          <span>  to </span>
          <input type="number" style={{ width: '60px' }} readOnly value="0" />
        </div>
        <div>
          <span></span>  Number of words:  <input style={{ width: '60px' }} placeholder="250" type="number" onKeyDown={handleSetWordsNumber} />
        </div>

      </div>
      <div className="fields-container">
        <div >
          <span>Scale: </span>
          <input type="radio" name="scale" id="log" value="log" disabled readOnly checked />
          <label htmlFor="log">log n</label>
          <input type="radio" name="scale" id="sn" value="sn" disabled readOnly />
          <label htmlFor="sn">√n</label>
          <input type="radio" name="scale" id="n" value="n" disabled readOnly />
          <label htmlFor="n">n</label>
        </div>
        <div></div>
        <div>
          <input type="checkbox" id="oneword" readOnly /><label htmlFor="oneword">One word per line </label>
        </div>
      </div>
      <div className="fields-container">
        <div >
          <span>Font: </span>
          <input type="text" readOnly value="Impact" />
        </div>
        <div></div>
        <div>
          <span>Download: </span> <button>SVG</button>
        </div>
      </div>

      <div className="upload-area">
        <FileDrop
          onDrop={(files, event) => fileDrop(event, files)}
        >
          <div>
            <FaCloudUploadAlt size={40} color="#4057ff" />
          </div>
          Drag and Drop files here to upload.
        <div>Or</div>
        </FileDrop>
        <input type="file" id="file" ref={refFileUpload} onChange={(e) => uploadFile(e, e.target.files)} />
        <button onClick={() => refFileUpload.current.click()}>
          Select file to upload
        </button>
      </div >

      <div className="margin-bottom">
        <input type="checkbox" id="preview" onChange={(e) => { setPreviewDisplay(e.target.checked) }} /><label htmlFor="preview">
          Preview
        </label>
      </div>
      <div className={`${!previewDisplay ? 'hidden' : ''} paragraph-container margin-bottom`}  >
        <div className="paragraph">
          {paragraph}
        </div>
      </div>
    </div >
  );
}

export default App;
