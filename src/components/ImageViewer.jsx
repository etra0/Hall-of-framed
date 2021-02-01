import classNames from 'classnames';
import React, { useEffect, useReducer } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Cancel, ExitFullscreen, Fullscreen } from '../assets/svgIcons';
import Spinner from '../components/Spinner/Spinner';
import { useFullscreenStatus } from '../utils/utils';

const reducer = (state, action) => {
  switch (action.type) {
    case 'initialize':
      return { ...state, initialized: true };
    case 'close':
      return { initialized: false, loadedState: false, showImage: false };
    case 'loadImage':
      return { initialized: true, loadedState: true, showImage: true };
    case 'changeImage':
      return { ...state, loadedState: false };
    case 'showGlobalSpinner':
        return { ...state, initialized: false, showImage: false };
    default:
      return state;
  }
};

const ImageViewer = ({ image = {}, show, onClose, data, onPrev, onNext, setBgImage }) => {
  const [{ initialized, loadedState, showImage }, dispatch] = useReducer(reducer, {
    initialized: false,
    loadedState: false,
    showImage: false,
  });

  let isFullscreen, setIsFullscreen;
  const imageViewerContent = React.useRef(null);
  let fullScreenError;
  try {
    [isFullscreen, setIsFullscreen] = useFullscreenStatus(imageViewerContent);
  } catch (e) {
    fullScreenError = 'Fullscreen not supported';
    isFullscreen = false;
    setIsFullscreen = undefined;
  }

  const visibleClass = show ? 'is-visible' : undefined;
  const prevDisabled = data.findIndex((e) => e.id === image.id) === 0 || !loadedState;
  const nextDisabled = data.findIndex((e) => e.id === image.id) === data.length - 1 || !loadedState;

  const handleExitFullscreen = () => document.exitFullscreen();

  const handlePrev = React.useCallback((event) => {
      event?.stopPropagation();
      dispatch({ type: 'changeImage' });
      onPrev();
    },
    [onPrev],
  );

  const handleNext = React.useCallback((event) => {
      event?.stopPropagation();
      dispatch({ type: 'changeImage' });
      onNext();
    },
    [onNext],
  );

  const handleClose = React.useCallback(() => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      dispatch({ type: 'close' });
      onClose();
    }
  }, [isFullscreen, onClose]);

  const handleLoad = () => {
    dispatch({ type: 'loadImage' });
    setBgImage(image);
  };

  const handleKeyboard = React.useCallback(
    (event) => {
      const { key } = event;

      if (!show) {
        return false;
      }

      switch (key) {
        case 'ArrowRight':
          if (nextDisabled) {
            return false;
          }
          return handleNext(event);
        case 'ArrowLeft':
          if (prevDisabled) {
            return false;
          }
          return handlePrev(event);
        case 'Escape':
          if (isFullscreen) {
            return false;
          }
          return handleClose();
        case 'f':
          if (fullScreenError) {
            return false;
          }
          return setIsFullscreen();
        default:
          return false;
      }
    },
    [
      isFullscreen,
      handleClose,
      handleNext,
      handlePrev,
      nextDisabled,
      prevDisabled,
      setIsFullscreen,
      fullScreenError,
      show,
    ],
  );

  useEffect(() => {
    window.addEventListener('keyup', handleKeyboard);

    // remove listener when component unmounts
    return () => {
      window.removeEventListener('keyup', handleKeyboard);
    };
  }, [initialized, handleKeyboard]);

  const swipeConfig = {
    delta: 10,
    preventDefaultTouchmoveEvent: true,
    trackTouch: true,
    trackMouse: true,
    rotationAngle: 0,
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (nextDisabled) {
        return false;
      }
      imageViewerContent.current.style.left = '0px';
      dispatch({ type: 'showGlobalSpinner' });
      return handleNext();
    },
    onSwipedRight: () => {
      if (prevDisabled) {
        return false;
      }
      imageViewerContent.current.style.left = '0px';
      dispatch({ type: 'showGlobalSpinner' });
      return handlePrev();
    },
    onSwiping: (event) => {
      if ((event.dir === 'Right' && !prevDisabled) || (event.dir === 'Left' && !nextDisabled)) {
        imageViewerContent.current.style.left = `${event.deltaX}px`;
      } else {
        imageViewerContent.current.style.left = '0px';
      }
    },
    onSwiped: () => {
      imageViewerContent.current.style.left = '0px';
    },
    ...swipeConfig,
  });

  const modifier = !initialized ? 'global' : '';
  const fullscreenClass = isFullscreen ? 'fullscreen' : false;
  const loadedClass = showImage ? 'loaded' : 'hidden';

  return (
    <div className={classNames('image-viewer', 'framed-modal', visibleClass)} onClick={handleClose}>
      <div className="image-nav">
        <button className="image-nav-button left" disabled={prevDisabled} onClick={handlePrev}>
          [ Prev ]
        </button>
        <button className="image-nav-button right" disabled={nextDisabled} onClick={handleNext}>
          [ Next ]
        </button>
      </div>

      <div ref={imageViewerContent} className={classNames('image-viewer-content', fullscreenClass)}>
        {image && (
          <>
            <img
              alt={image.gameName}
              src={image.shotUrl}
              onClick={(event) => {
                event.stopPropagation();
              }}
              onLoad={handleLoad}
              className={loadedClass}
              {...handlers}
            />
            {initialized && !isFullscreen && (
              <div
                className="shot-info"
                onClick={(event) => {
                  event.stopPropagation();
                }}
              >
                {/* <img src={image.authorsAvatarUrl} alt="avatar" /> */}
                <div className="info">
                  <span className="by">by</span> <span className="author">{image.author}</span>
                  <span className="title">{image.gameName}</span>
                </div>
                {!isFullscreen && !fullScreenError && (
                  <button className="fullscreen-button" onClick={setIsFullscreen}>
                    <Fullscreen />
                  </button>
                )}
              </div>
            )}
            {isFullscreen ? (
              <button className="close" onClick={handleExitFullscreen}>
                <ExitFullscreen />
              </button>
            ) : (
              <button className="close" onClick={handleClose}>
                <Cancel />
              </button>
            )}
          </>
        )}
        <Spinner modifier={modifier} show={!loadedState} />
      </div>
    </div>
  );
};

export default ImageViewer;
