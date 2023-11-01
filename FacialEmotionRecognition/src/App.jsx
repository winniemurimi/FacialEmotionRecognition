import * as faceapi from 'face-api.js';
import React from 'react';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveBar } from '@nivo/bar';

function App() {
  const [modelsLoaded, setModelsLoaded] = React.useState(false);
  const [captureVideo, setCaptureVideo] = React.useState(false);
  const [emotionData, setEmotionData] = React.useState([]);

  const videoRef = React.useRef();
  const videoHeight = 480;
  const videoWidth = 640;
  const canvasRef = React.useRef();

  React.useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';

      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]).then(() => setModelsLoaded(true));
    };

    loadModels();
  }, []);

  const startVideo = () => {
    setCaptureVideo(true);
    navigator.mediaDevices
      .getUserMedia({ video: { width: 300 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error('error:', err);
      });
  };

  const handleVideoOnPlay = () => {
    setInterval(async () => {
      if (canvasRef && canvasRef.current) {
        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current);
        const displaySize = {
          width: videoWidth,
          height: videoHeight,
        };

        faceapi.matchDimensions(canvasRef.current, displaySize);

        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        canvasRef.current &&
          canvasRef.current.getContext('2d').clearRect(0, 0, videoWidth, videoHeight);
        canvasRef.current && faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
        canvasRef.current && faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        canvasRef.current && faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);

        const emotions = resizedDetections.map((detection) => detection.expressions);
        const aggregatedEmotions = emotions.reduce((acc, curr) => {
          Object.entries(curr).forEach(([emotion, value]) => {
            if (acc[emotion]) {
              acc[emotion] += value;
            } else {
              acc[emotion] = value;
            }
          });
          return acc;
        }, {});

        const totalEmotions = Object.values(aggregatedEmotions).reduce((acc, curr) => acc + curr, 0);
        const emotionPercentage = Object.entries(aggregatedEmotions).map(([emotion, value]) => ({
          emotion,
          percentage: (value / totalEmotions) * 100,
        }));

        setEmotionData(emotionPercentage);
      }
    }, 200);
  };

  const closeWebcam = () => {
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
    setCaptureVideo(false);
  };

  return (
    <>
    <div>
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
  <video
    ref={videoRef}
    height={videoHeight}
    width={videoWidth}
    onPlay={handleVideoOnPlay}
    style={{ borderRadius: '10px' }}
  />
  <canvas ref={canvasRef} style={{ position: 'absolute' }} />
  <div style={{ width: '600px', height: '400px', marginLeft: '10px' }}>
    <ResponsiveStream
      data={emotionData}
      keys={['percentage']}
      margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
      curve="monotoneX"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Emotion',
        legendPosition: 'middle',
        legendOffset: 32,
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'Percentage',
        legendPosition: 'middle',
        legendOffset: -40,
      }}
      offsetType="diverging"
      colors={{ scheme: 'category10' }}
      fillOpacity={0.85}
      borderColor={{ theme: 'background' }}
      defs={[
        {
          id: 'dots',
          type: 'patternDots',
          background: 'inherit',
          color: '#2c998f',
          size: 4,
          padding: 2,
          stagger: true,
        },
        {
          id: 'squares',
          type: 'patternSquares',
          background: 'inherit',
          color: '#e4c912',
          size: 6,
          padding: 2,
          stagger: true,
        },
      ]}
      fill={[
        {
          match: {
            id: 'percentage',
          },
          id: 'dots',
        },
        {
          match: {
            id: 'emotion',
          },
          id: 'squares',
        },
      ]}
      animate={true}
      motionStiffness={90}
      motionDamping={15}
    />
  </div>
</div>


  <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
        {captureVideo && modelsLoaded ? (
          <button
            onClick={closeWebcam}
            style={{
              cursor: 'pointer',
              backgroundColor: 'green',
              color: 'white',
              padding: '15px',
              fontSize: '25px',
              border: 'none',
              borderRadius: '10px',
            }}
          >
            Close Webcam
          </button>
        ) : (
          <button
            onClick={startVideo}
            style={{
              cursor: 'pointer',
              backgroundColor: 'green',
              color: 'white',
              padding: '15px',
              fontSize: '25px',
              border: 'none',
              borderRadius: '10px',
            }}
          >
            Open Webcam
          </button>
        )}
      </div>
      {captureVideo ? (
        modelsLoaded ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
              <video
                ref={videoRef}
                height={videoHeight}
                width={videoWidth}
                onPlay={handleVideoOnPlay}
                style={{ borderRadius: '10px' }}
              />
              <canvas ref={canvasRef} style={{ position: 'absolute' }} />
            </div>
            <div style={{ width: '600px', height: '400px', margin: 'auto' }}>
              <ResponsiveBar
                data={emotionData}
                keys={['percentage']}
                indexBy="emotion"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Emotion',
                  legendPosition: 'middle',
                  legendOffset: 32,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Percentage',
                  legendPosition: 'middle',
                  legendOffset: -40,
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                animate={true}
                motionStiffness={90}
                motionDamping={15}
              />
            </div>
          </div>
        ) : (
          <div>loading...</div>
        )
      ) : (
        <></>
      )}
    </div>
    </>
  );
}

export default App;