import React, { useEffect, useState } from 'react';

import styles from './styles.module.scss';
import { render } from 'enzyme';
import { getLocationOrigin } from 'next/dist/next-server/lib/utils';

const makeRequest = async params => {
  const url = `https://challenge20.appspot.com/?${params}`;
  const response = await fetch(url);
  const data = await response.text();
  return data;
};

const paramBuilder = ({
  command = 'M',
  referenceid = 'MSwxLEU=',
  repeat = 1
}) => {
  //https://challenge20.appspot.com/?command=M&referenceid=MTEsOCxF&repeat=1
  return `command=${command}&referenceid=${referenceid}&repeat=${repeat}`;
};

const parseResponse = data => {
  const parsed = data.split(',');
  const referenceid = parsed[0];
  const corridor = parsed.slice(1);
  return { referenceid, corridor };
};

const Pathfinder = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [pathArray, setPathArray] = useState([]);
  const [corridor, setCorridor] = useState('');
  const [facingDirection, setFacingDirection] = useState(0);
  const [initialReferenceid, setInitialReferenceid] = useState('');
  const [gameMap, setGameMap] = useState([]);

  /*
  [
    [*, *, *, * ],
    [*, ., ., * ],
    [' ', '.', '*', ' ' ]

*****
*...*
***.*
**..*
**.**
*X..*
*****    ]
  */

  const updatePathArray = data => {
    setPathArray([...pathArray, data]);
  };

  const updateGameMap = ({ corridor }) => {
    const mappedCorridor = corridor.map(direction => {
      switch (direction) {
        default:
        case 'O':
        case 'OL':
        case 'OR': {
          return '.';
        }
      }
    });

    const mappedWithWall = [...mappedCorridor, '*'];

    setGameMap([...gameMap, mappedWithWall]);
  };

  const printGameMap = () => {
    gameMap.forEach(row => {
      console.log(row.join(''));
    });
  };

  useEffect(() => {
    printGameMap();
  }, [gameMap]);

  useEffect(() => {
    getInitialStuff();
  }, []);

  useEffect(() => {
    setCorridor(renderLastCorridor());
  }, [pathArray]);

  const getCurrentPath = () => {
    return pathArray[pathArray.length - 1];
  };

  const getInitialStuff = async () => {
    const initialStuff = await makeRequest();
    const parsedInitialStuff = parseResponse(initialStuff);
    const { referenceid } = parsedInitialStuff;
    setInitialReferenceid(referenceid);
    updatePathArray(parsedInitialStuff);
    updateGameMap(parsedInitialStuff);
    setIsLoading(false);
  };

  const PathBlock = ({ direction }) => {
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
        return <pre> [ 🏆] </pre>;
      }
    }
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

  const getLocation = () => {
    if (pathArray.length === 0) {
      return '';
    }
    return pathArray[pathArray.length - 1].referenceid;
  };

  const compassDirection = () => {
    switch (facingDirection) {
      case 0: {
        return 'North';
      }
      case 1: {
        return 'East';
      }
      case 2: {
        return 'South';
      }
      case 3: {
        return 'West';
      }
    }
  };

  const rotateLeft = async () => {
    setFacingDirection(facingDirection === 0 ? 3 : facingDirection - 1);
    const newPath = await makeRequest(
      paramBuilder({
        command: 'L',
        referenceid: getCurrentPath() && getCurrentPath().referenceid
      })
    );
    const parsedPath = parseResponse(newPath);
    updatePathArray(parsedPath);
    updateGameMap(parsedPath);
  };
  const rotateRight = async () => {
    setFacingDirection((facingDirection + 1) % 4);
    const newPath = await makeRequest(
      paramBuilder({
        command: 'R',
        referenceid: getCurrentPath() && getCurrentPath().referenceid
      })
    );
    const parsedPath = parseResponse(newPath);
    updatePathArray(parsedPath);
    updateGameMap(parsedPath);
  };
  const moveForward = async () => {
    const newPath = await makeRequest(
      paramBuilder({
        command: 'M',
        referenceid: getCurrentPath() && getCurrentPath().referenceid
      })
    );
    const parsedPath = parseResponse(newPath);
    updatePathArray(parsedPath);
    updateGameMap(parsedPath);
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
    <div className={styles.container}>
      <div>Facing {compassDirection()}</div>
      <div>Location: {getLocation()}</div>
      <div className={styles.corridor}>
        {isLoading && <p>'Loading'</p>}
        <pre>/////</pre>
        <pre>-----</pre>
        {corridor}
        <pre>
          ?[<span>.</span>]?
        </pre>
      </div>

      {/* <Moves /> */}
      <Controls />
    </div>
  );
};

export default Pathfinder;
