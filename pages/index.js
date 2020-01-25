import React, {useEffect, useState} from 'react';

import styles from './styles.module.scss';
import {render} from 'enzyme';
import {getLocationOrigin} from 'next/dist/next-server/lib/utils';
import {useEventListener} from '../utils/event.util';

const makeRequest = async params => {
  const url = `https://challenge20.appspot.com/?${params}`;
  const response = await fetch(url);
  const data = await response.text();
  return data;
};

const paramBuilder = ({
  command = 'M',
  referenceid = 'MSwxLEU=',
  repeat = 1,
}) => {
  //https://challenge20.appspot.com/?command=M&referenceid=MTEsOCxF&repeat=1
  return `command=${command}&referenceid=${referenceid}&repeat=${repeat}`;
};

const parseResponse = data => {
  const parsed = data.split(',');
  const referenceid = parsed[0];
  const corridor = parsed.slice(1);
  return {referenceid, corridor};
};

const Pathfinder = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [pathArray, setPathArray] = useState([]);
  const [facingDirection, setFacingDirection] = useState(0);
  const [location, setLocation] = useState([0, 0]);
  const [gameMap, setGameMap] = useState([[]]);

  const updatePathArray = data => {
    setPathArray([...pathArray, data]);
  };

  useEffect(() => {
    getInitialStuff();
  }, []);

  if (process.browser) {
    useEventListener('keydown', event => {
      if (event.key === 'ArrowUp') {
        moveForward();
      }
      if (event.key === 'ArrowLeft') {
        rotateLeft();
      }
      if (event.key === 'ArrowRight') {
        rotateRight();
      }
    });
  }

  useEffect(() => {
    addLocationToMap();
  }, [location]);

  const getCurrentPath = () => {
    return pathArray[pathArray.length - 1];
  };

  const getInitialStuff = async () => {
    const initialStuff = await makeRequest();
    const parsedInitialStuff = parseResponse(initialStuff);
    updatePathArray(parsedInitialStuff);
    setGameMap([['.']]);
    setIsLoading(false);
  };

  const PathBlock = ({direction}) => {
    switch (direction) {
      default:
      case 'O': {
        return <pre> [ ] </pre>;
      }
      case 'OL': {
        return <pre>&larr;[ ]</pre>;
      }
      case 'OR': {
        return <pre> [ ]&rarr;</pre>;
      }
      case 'OLR': {
        return <pre>&larr;[ ]&rarr;</pre>;
      }
      case 'X': {
        return <pre> [🏆] </pre>;
      }
    }
  };

  const addLocationToMap = () => {
    const newGameMap = gameMap.slice(0);

    while (newGameMap.length - 1 < location[1]) {
      newGameMap.push([]);
    }
    while (newGameMap[location[1]].length - 1 < location[0]) {
      newGameMap[location[1]].push(' ');
    }
    newGameMap[location[1]][location[0]] = ['*'];
    setGameMap(newGameMap);
    console.log(newGameMap);
  };

  const renderLastCorridor = () => {
    if (pathArray.length === 0) {
      return '';
    }
    const corridor = pathArray[pathArray.length - 1].corridor;

    return corridor
      .reverse()
      .map((direction, index) => (
        <PathBlock direction={direction} key={`${direction}-${index}`} />
      ));
  };

  const getCurrentReferenceId = () => {
    if (pathArray.length === 0) {
      return '';
    }
    return pathArray[pathArray.length - 1].referenceid;
  };

  const compassDirection = () => {
    switch (facingDirection) {
      case 0: {
        return 'East';
      }
      case 1: {
        return 'South';
      }
      case 2: {
        return 'West';
      }
      case 3: {
        return 'North';
      }
    }
  };

  const renderGameMap = () => {
    if (gameMap[location[1]] && gameMap[location[1]][location[0]]) {
      let arrow;
      switch (facingDirection) {
        case 0: {
          arrow = '→';
          break;
        }
        case 1: {
          arrow = '↓';
          break;
        }
        case 2: {
          arrow = '←';
          break;
        }
        case 3: {
          arrow = '↑';
          break;
        }
      }

      const mapCopy = gameMap.slice(0);
      mapCopy[location[1]][location[0]] = arrow;
      return mapCopy.map(row => <pre>{row.join('')}</pre>);
    } else {
      return '';
    }
  };

  const rotateLeft = async () => {
    setFacingDirection(facingDirection === 0 ? 3 : facingDirection - 1);
    const newPath = await makeRequest(
      paramBuilder({
        command: 'L',
        referenceid: getCurrentPath() && getCurrentPath().referenceid,
      }),
    );
    const parsedPath = parseResponse(newPath);
    updatePathArray(parsedPath);
  };
  const rotateRight = async () => {
    setFacingDirection((facingDirection + 1) % 4);
    const newPath = await makeRequest(
      paramBuilder({
        command: 'R',
        referenceid: getCurrentPath() && getCurrentPath().referenceid,
      }),
    );
    const parsedPath = parseResponse(newPath);
    updatePathArray(parsedPath);
  };

  const moveForward = async () => {
    const newPath = await makeRequest(
      paramBuilder({
        command: 'M',
        referenceid: getCurrentPath() && getCurrentPath().referenceid,
      }),
    );
    const parsedPath = parseResponse(newPath);
    if (parsedPath.referenceid !== getCurrentReferenceId()) {
      switch (facingDirection) {
        case 0: {
          setLocation([location[0] + 1, location[1]]);
          break;
        }
        case 1: {
          setLocation([location[0], location[1] + 1]);
          break;
        }
        case 2: {
          setLocation([location[0] - 1, location[1]]);
          break;
        }
        case 3: {
          setLocation([location[0], location[1] - 1]);
          break;
        }
      }

      addLocationToMap();
    }
    updatePathArray(parsedPath);
  };

  const Controls = () => (
    <div className={styles.controls}>
      <button type="button" onClick={rotateLeft}>
        &larr; Turn left
      </button>
      <button type="button" onClick={moveForward}>
        Move forward &uarr;
      </button>
      <button type="button" onClick={rotateRight}>
        Turn right &rarr;
      </button>
    </div>
  );

  return (
    <>
      <div>Facing {compassDirection()}</div>
      <div>Location {location.toString()}</div>
      <div>referenceid: {getCurrentReferenceId()}</div>
      <div className={styles.container}>
        <div className={styles.column}>
          <div className={styles.corridor}>
            {isLoading && <p>'Loading'</p>}
            <pre>/////</pre>
            <pre>-----</pre>
            {renderLastCorridor()}
            <pre>
              ?[<span>&uarr;</span>]?
            </pre>
          </div>
        </div>
        <div className={styles.column}>
          <div>{renderGameMap()}</div>
        </div>
      </div>
      <Controls />
    </>
  );
};

export default Pathfinder;
