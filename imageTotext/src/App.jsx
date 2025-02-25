
import { useState, useRef, useEffect } from 'react'
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import Tesseract from 'tesseract.js';
import LinearProgress from '@mui/material/LinearProgress';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css'
import './App.css';
function App() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [crop, setCrop] = useState({ aspect: 1, width: 50, height: 50 });
  const [src, setSrc] = useState('');
  const [captured, setCaptured] = useState(true);
  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });
  console.log("crop", crop);
  const video = useRef(null);
  const photo = useRef(null);
  const cameradiv = useRef();
  const fileUpload = useRef(null);
  const image = useRef(null);
  //Handler Function 
  const cameraHandler = () => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio:false })
      .then((stream) => {
        video.current.srcObject = stream;
        video.current.play();

      }).catch((error) => console.log(error));
    setVisible((state) => !state);
  }
  // //preprocessing image 
  // const createBlobUrlFromCanvas = (canvas) => {
  //   return new Promise((resolve) => {
  //     canvas.toBlob((blob) => {
  //       const url = URL.createObjectURL(blob);
  //       resolve(url);
  //     }, 'image/png');
  //   });
  // };
  const captureHandler = async () => {
    if (!video.current) return;
    setCaptured((state) => !state);
    let canvas = document.createElement('canvas');
    let vid = video.current;
    let ctx = canvas.getContext("2d");
    ctx.filter = 'grayscale(1)';
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;

    ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
    console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
    let url = canvas.toDataURL('image/png');
    console.log("Captured Image URL:", url);
    setSrc(url);
    // setVisible((state) => !state);
    // setLoading(true);
    // setProgress(0);
    const stream = vid.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    vid.srcObject = null;
    // Tesseract.recognize(
    //   url,
    //   'eng',
    //   {
    //     logger: m => {
    //       console.log(m);
    //       if (m.status === "recognizing text") {
    //         setProgress(parseInt(m.progress * 100));
    //       }

    //     }
    //   }
    // ).then(({ data: { text } }) => {
    //   console.log(text);
    //   setData(text);
    //   setLoading(false);
    //   URL.revokeObjectURL(url);

    // }).catch((error) => {
    //   console.log(error);
    //   setData("Check Your Internet Connection");
    // });
  }

const closeHandler = () => {
  setVisible((state) => !state);
  let vid = video.current;
  const stream = vid.srcObject;
  const tracks = stream.getTracks();
  tracks.forEach(track => track.stop());
  vid.srcObject = null;
}
  const getCroppedImg = async (imageSrc, crop) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
  
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
  
        // Scale factors
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
  
        // Set canvas size to crop area
        canvas.width = crop.width;
        canvas.height = crop.height;
  
        // Draw cropped image on canvas
        ctx.drawImage(
          image,
          crop.x * scaleX, // Adjust X
          crop.y * scaleY, // Adjust Y
          crop.width * scaleX, // Adjust Width
          crop.height * scaleY, // Adjust Height
          0,
          0,
          crop.width,
          crop.height
        );
  
        // Convert canvas to a Blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      };
    });
  };
  
  const extractTextFromCroppedImage = async () => {
    if (!src || !crop.width || !crop.height) return;
    console.log("function ke andar a gya");
     setVisible((state) => !state);
     setLoading(true);
     setProgress(0);
     setSrc("");
    const croppedBlob = await getCroppedImg(src, crop);
    const croppedURL = URL.createObjectURL(croppedBlob);
  
    Tesseract.recognize(
      croppedURL,
      "eng",
      {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(parseInt(m.progress * 100));
          }
        },
      }
    )
      .then(({ data: { text } }) => {
        setData(text);
        setLoading(false);
        URL.revokeObjectURL(croppedURL);
      })
      .catch((error) => {
        console.log(error);
        setData("Check your internet connection.");
        setLoading(false);
      });
  };
  
  const uploadFileHandler = (event) => {
    if (!fileUpload.current.files.length) return; 
  
    const fir = new FileReader();
    let file = fileUpload.current.files[0];
    let extension = file.name.split('.').pop().toLowerCase(); 
  
    if (extension === "jpg" || extension === "jpeg" || extension === "png") {
      fir.readAsDataURL(file);
  
      fir.onload = function () {
        let url = fir.result; // Read as Data URL
        console.log("Uploaded file URL:", url);
  
        setLoading(true);
        setProgress(0);
  
        Tesseract.recognize(
          url, // Pass Data URL instead of Object URL
          'eng',
          {
            logger: (m) => {
              console.log(m);
              if (m.status === "recognizing text") {
                setProgress(Math.floor(m.progress * 100));
              }
            }
          }
        ).then(({ data: { text } }) => {
          console.log("Extracted text:", text);
          setData(text);
          setLoading(false);
        }).catch((error) => {
          console.log("OCR Error:", error);
          setData("Check your internet connection.");
          setLoading(false);
        });
      };
  
      fir.onerror = function (error) {
        console.error("File reading error:", error);
        setLoading(false);
      };
  
    } else {
   
        alert("doc pdf etc.. file is not supported");

      }
    //   fir.readAsText(file);
  
    //   fir.onload = function () {
    //     setData(fir.result);
    //     console.log("Extracted text from file:", fir.result);
    //     setLoading(false);
    //   };
  
    //   fir.onerror = function (error) {
    //     console.error("Text file reading error:", error);
    //     setLoading(false);
    //   };
    // }
  };
  
  return (
    <>
      <div className={`bg-slate-800 w-full min-h-screen flex flex-col justify-center items-center gap-10 ${visible ? 'hidden' : ''} `} >
        <h1 className='text-[3vw] text-white pt-5'>Image To Text Converter</h1>
        <div className='w-11/12 flex flex-wrap items-center justify-center gap-10 p-5'>
          <div className='flex-initial flex flex-col items-center justify-center gap-5 w-[30rem] h-[30rem] bg-gray-600 outline-dotted outline-4 outline-offset-2 outline-white rounded-md drop-shadow-2xl '>
            <Button
              component="label"
              role={undefined}
              variant="contained"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
              sx={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 20px',
                '@media (max-width: 640px)': {
                  fontSize: '0.875rem',
                  padding: '8px 16px',
                  maxWidth: '200px',
                },
              }}
            >
              Upload files
              <VisuallyHiddenInput
                type="file"
                ref={fileUpload}
                onChange={uploadFileHandler}
                multiple

              />
            </Button>
            <Button variant="outlined" onClick={cameraHandler} sx={{
              width: '100%',
              maxWidth: '300px',
              padding: '10px 20px',
              '@media (max-width: 640px)': {
                fontSize: '0.875rem',
                padding: '8px 16px',
                width: '200px'
              },
            }}>
              <CenterFocusWeakIcon />&nbsp;
              Open Camera
            </Button>
          </div>
          <div className='flex-initial w-[30rem] flex flex-col items-center justify-center h-[30rem] bg-slate-950 outline-dotted outline-4 outline-offset-2 outline-white rounded-md drop-shadow-2xl overflow-auto items-center'>
            {
              !loading &&
              <textarea rows={17} value={data} className='w-full h-full bg-slate-950 text-blue-400 p-4' onChange={(e) => setData(e.target.value)} disabled={false} placeholder='Extract text from image' />
              // <Textarea

              //   disabled={false}
              //   minRows={17}
              //   value={data}
              //   size="lg"
              //   variant="solid"
              // />
            }
            {
              loading && <div className='max-w-80 mx-auto px-5 flex flex-col gap-3'>
                <pre className='text-white mx-auto'>{`Recognizing text : ${progress} %`}</pre>
                <LinearProgress variant="determinate" value={progress} />
              </div>


            }
          </div>

        </div>
      </div>
      <div ref={cameradiv} className={`modal bg-slate-800 flex w-full h-screen justify-center items-center ${visible ? '' : 'hidden'}`}>
        <div className=' relative flex items-center justify-center w-full h-full max-w-[50rem] max-h-[50rem] overflow-hidden p-5'>
          <div className=' relative w-full h-full max-w-[40rem] max-h-[40rem] overflow-hidden animate'>
            <video className="no-mirror w-full h-full object-cover bg-gray-500" ref={video}></video>
            {
               src && 
               <div className='absolute z-10 left-0 top-0 '>
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} unit="px">
                    <img src={src} />
                   </ReactCrop>

                </div>
            
          }
            <h1 className='absolute left-[20px] bottom-[100px] text-white'>Crop the above image...</h1>
            <div className='absolute left-[20px] bottom-[40px] flex gap-3'>
              {
               captured ? (
                <>
                <Button variant="contained" color="success" onClick={captureHandler}>
                Capture
              </Button>
              <Button variant="contained" color="warning" onClick={closeHandler}>
                 Close
              </Button>
                </>
              ):(
                <>
               <Button variant="contained" color="success" onClick={extractTextFromCroppedImage}>
                 Extract Words
              </Button>
              
              </>
              )
              }
              
            </div>
          </div>

        </div>


      </div>
    </>
  )
}

export default App
