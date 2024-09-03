
import { useState, useRef, useEffect } from 'react'
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import Tesseract from 'tesseract.js';
import LinearProgress from '@mui/material/LinearProgress';
import './App.css';
function App() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
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
  const video = useRef(null);
  const photo = useRef(null);
  const cameradiv = useRef();
  const fileUpload = useRef(null);
  const image = useRef(null);
  //Handler Function 
  const cameraHandler = () => {
    navigator.mediaDevices.getUserMedia({ video: {facingMode:'environment' } })
      .then((stream) => {
        video.current.srcObject = stream;
        video.current.play();

      }).catch((error) => console.log(error));
    setVisible((state) => !state);
  }
  //preprocessing image 

  const captureHandler = async () => {


    const width = 640;
    const height = 640;

    let vid = video.current;
    let img = photo.current;
   
    img.width = width;
    img.height = height;
    console.log("mid");
    let ctx = img.getContext("2d");
    ctx.drawImage(vid, 0, 0, width, height);
   
    let url = img.toDataURL('image/png');
   
    setVisible((state) => !state);
    const stream = vid.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    vid.srcObject = null;
    setLoading(true);
    setProgress(0);
    Tesseract.recognize(
      url,
      'eng',
      {
        logger: m => {
          console.log(m);
          if (m.status === "recognizing text") {
            setProgress(parseInt(m.progress * 100));
          }

        }
      }
    ).then(({ data: { text } }) => {
      console.log(text);
      setData(text);
      setLoading(false);
      URL.revokeObjectURL(url);

    }).catch((error) => {
      console.log(error);
      setData("Check Your Internet Connection");
    });



  }
  window.onclick = function (event) {
    if (event.target == cameradiv.current) {
      setVisible((state) => !state);
    }
  }
  const uploadFileHandler = (event) => {
    const fir = new FileReader();

    let extension = fileUpload.current.files[0].name.split('.').at(-1);
    console.log(extension);
    if (extension === "jpg" || extension === "jpeg" || extension === "png") {

      fir.readAsDataURL(fileUpload.current.files[0]);
      let url = URL.createObjectURL(fileUpload.current.files[0]);
      console.log(url);
      fir.onload = function () {

        setLoading(true);
        setProgress(0);
        Tesseract.recognize(
          url,
          'eng',
          {
            logger: m => {
              console.log(m);
              if (m.status === "recognizing text") {
                setProgress(parseInt(m.progress * 100));
              }

            }
          }
        ).then(({ data: { text } }) => {
          console.log(text);
          setData(text);
          setLoading(false);
          URL.revokeObjectURL(url);
        }).catch((error) => {
          console.log(error);
          setData("check Your internet Connection");
        })
      }

    } else {
      fir.readAsText(fileUpload.current.files[0]);
      fir.onload = function () {
        setData(fir.result);
        console.log(data);
      }
    }

  }
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
                  maxWidth:'200px',
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
                  width:'200px'
                },
              }}>
              <CenterFocusWeakIcon />&nbsp;
              Open Camera
            </Button>
          </div>
          <div className='flex-initial w-[30rem] h-[30rem] bg-slate-950 outline-dotted outline-4 outline-offset-2 outline-white rounded-md drop-shadow-2xl overflow-auto items-center'>
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
              loading && <div className='w-80 mx-auto mt-[44%] flex flex-col gap-3'>
                <pre className='text-white mx-auto'>{`Recognizing text : ${progress} %`}</pre>
                <LinearProgress variant="determinate" value={progress} />
              </div>

            }
          </div>

        </div>
      </div>
      <div ref={cameradiv} className={`modal bg-slate-800 flex w-full h-screen justify-center items-center ${visible ? '' : 'hidden'}`}>
        <div className=' relative w-full h-full max-w-[40rem] max-h-[40rem] overflow-hidden animate bg-blue-400 relative w-[40rem] h-[40rem]'>
          <video className="no-mirror w-full h-full object-cover bg-red-200" ref={video}></video>
          <canvas ref={photo} className='hidden'></canvas>

          <div className='absolute left-[20px] bottom-[20px]'>

            <Button variant="contained" color="success" onClick={captureHandler}>
              Capture
            </Button>
          </div>
        </div>


      </div>
    </>
  )
}

export default App
