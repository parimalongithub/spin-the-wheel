import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const DEFAULT_NAMES = [
  'Parimal',
  'Madhur',
  'Prerna',
  'Mohit',
  'Prasad',
  'Bhumika',
  'Sanika',
  'Sumit',
  'Tushar',
  'Jyotishman',
  'Pratham',
  'Shrikant',
];

const WHEEL_COLORS = [
  '#7d0f4a',
  '#a3155f',
  '#c81f75',
  '#db317f',
  '#ed4a96',
  '#ff66ad',
  '#f06099',
  '#ce2d76',
  '#991556',
  '#5f0934',
];

const CONFETTI_COLORS = ['#ff5aa9', '#ffd166', '#7cf7d4', '#8ec5ff', '#ffffff'];

function splitNames(input) {
  return input
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function buildBalancedGroupSizes(totalMembers, preferredSize) {
  if (!totalMembers) {
    return [];
  }

  const groupCount = Math.ceil(totalMembers / preferredSize);
  const baseSize = Math.floor(totalMembers / groupCount);
  const remainder = totalMembers % groupCount;

  return Array.from({ length: groupCount }, (_, index) =>
    baseSize + (index < remainder ? 1 : 0)
  );
}

function sleep(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
}

function formatGroupText(groups) {
  return groups
    .map((group, index) => `Group ${index + 1}: ${group.join(', ')}`)
    .join('\n');
}

function ConfettiBurst() {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => (
        <span
          key={`confetti-${index + 1}`}
          className="confetti-piece"
          style={{
            left: `${(index % 7) * 14 + Math.random() * 6}%`,
            background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
            animationDelay: `${(index % 7) * 0.08}s`,
            animationDuration: `${2.4 + (index % 5) * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const canvasRef = useRef(null);
  const spinTimeoutRef = useRef(null);
  const rotationRef = useRef(0);
  const [namesText, setNamesText] = useState(DEFAULT_NAMES.join('\n'));
  const [managerName] = useState('Suhas Sir');
  const [mode, setMode] = useState('single');
  const [rotation, setRotation] = useState(0);
  const [wheelNames, setWheelNames] = useState(DEFAULT_NAMES);
  const [selectedName, setSelectedName] = useState('');
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);
  const [statusText, setStatusText] = useState('Single user winner');
  const [isSpinning, setIsSpinning] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [groups, setGroups] = useState([]);
  const [copiedLabel, setCopiedLabel] = useState('');

  const names = useMemo(() => splitNames(namesText), [namesText]);

  useEffect(() => {
    if (isSpinning) {
      return;
    }

    if (mode === 'single') {
      setWheelNames(names);
      return;
    }

    if (!groups.length) {
      setWheelNames(names);
    }
  }, [groups.length, isSpinning, mode, names]);

  useEffect(() => {
    setGroups((currentGroups) =>
      currentGroups
        .map((group) => group.filter((name) => names.includes(name)))
        .filter((group) => group.length)
    );

    if (selectedName && !names.includes(selectedName)) {
      setSelectedName('');
      setWinnerModalOpen(false);
    }
  }, [names, selectedName]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return undefined;
    }

    if (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent)) {
      return undefined;
    }

    const context = canvas.getContext?.('2d');

    if (!context) {
      return undefined;
    }

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 18;

    context.clearRect(0, 0, size, size);

    if (!wheelNames.length) {
      context.fillStyle = '#fde6f1';
      context.font = '700 28px "Segoe UI", sans-serif';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText('Add names', center, center);
      return undefined;
    }

    const arc = (Math.PI * 2) / wheelNames.length;

    wheelNames.forEach((name, index) => {
      const startAngle = -Math.PI / 2 + index * arc;
      const endAngle = startAngle + arc;

      context.beginPath();
      context.moveTo(center, center);
      context.arc(center, center, radius, startAngle, endAngle);
      context.closePath();
      context.fillStyle = WHEEL_COLORS[index % WHEEL_COLORS.length];
      context.fill();
      context.lineWidth = 3;
      context.strokeStyle = '#18000f';
      context.stroke();

      context.save();
      context.translate(center, center);
      context.rotate(startAngle + arc / 2);
      context.textAlign = 'right';
      context.textBaseline = 'middle';
      context.fillStyle = '#fff9fd';
      context.font = `${wheelNames.length > 10 ? 700 : 800} ${
        wheelNames.length > 10 ? 24 : 28
      }px "Segoe UI", sans-serif`;
      context.fillText(name, radius - 20, 0);
      context.restore();
    });

    return undefined;
  }, [wheelNames]);

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) {
        window.clearTimeout(spinTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  const runSpin = (pool, message) =>
    new Promise((resolve) => {
      const anglePerSlice = 360 / pool.length;
      const nextRotation =
        rotationRef.current + 360 * 6 + Math.floor(Math.random() * 360);

      setWheelNames(pool);
      setStatusText(message);
      setSelectedName('');
      setWinnerModalOpen(false);
      setIsSpinning(true);
      setRotation(nextRotation);
      rotationRef.current = nextRotation;

      spinTimeoutRef.current = window.setTimeout(() => {
        const normalizedRotation = ((nextRotation % 360) + 360) % 360;
        const pointerAngle = (360 - normalizedRotation) % 360;
        const winnerIndex =
          Math.floor((pointerAngle + anglePerSlice / 2) / anglePerSlice) % pool.length;
        const winner = pool[winnerIndex];

        setSelectedName(winner);
        setIsSpinning(false);
        resolve({ winner, nextRotation });
      }, 3600);
    });

  const handleModeChange = (nextMode) => {
    if (isSpinning) {
      return;
    }

    setMode(nextMode);
    setSelectedName('');
    setWinnerModalOpen(false);
    setCopiedLabel('');
    setStatusText(nextMode === 'single' ? 'Single user winner' : 'Create groups');
    setWheelNames(names);
  };

  const spinOne = async () => {
    if (isSpinning) {
      return;
    }

    if (!names.length) {
      setStatusText('Add at least one member before spinning');
      setSelectedName('');
      return;
    }

    const { winner, nextRotation } = await runSpin(names, 'Picking one winner');
    setRotation(nextRotation);
    setWheelNames(names);
    setSelectedName(winner);
    setStatusText(`Winner is ${winner}`);
    setWinnerModalOpen(true);
  };

  const createGroupsBySpin = async () => {
    if (isSpinning) {
      return;
    }

    if (!names.length) {
      setStatusText('Add at least one member before creating groups');
      return;
    }

    const targetSizes = buildBalancedGroupSizes(names.length, groupSize);
    const createdGroups = [];
    let pool = [...names];

    setGroups([]);
    setCopiedLabel('');
    setSelectedName('');
    setWinnerModalOpen(false);

    for (let groupIndex = 0; groupIndex < targetSizes.length; groupIndex += 1) {
      const currentGroup = [];

      for (let pickIndex = 0; pickIndex < targetSizes[groupIndex]; pickIndex += 1) {
        const { winner, nextRotation: updatedRotation } = await runSpin(
          pool,
          `Picking Group ${groupIndex + 1} member ${pickIndex + 1}`
        );

        currentGroup.push(winner);
        pool = pool.filter((name) => name !== winner);
        setRotation(updatedRotation);
        setGroups([...createdGroups, [...currentGroup]]);
        setWheelNames(pool.length ? pool : currentGroup);
        await sleep(450);
      }

      createdGroups.push(currentGroup);
      setGroups([...createdGroups]);
      await sleep(300);
    }

    setWheelNames(createdGroups[createdGroups.length - 1] || names);
    setStatusText(`Created ${createdGroups.length} groups`);
    setSelectedName('');
    setIsSpinning(false);
  };

  const copyAllGroups = async () => {
    await copyText(formatGroupText(groups));
    setCopiedLabel('All groups copied');
  };

  const removeWinner = () => {
    if (!selectedName || isSpinning) {
      return;
    }

    const nextNames = names.filter((name) => name !== selectedName);
    setNamesText(nextNames.join('\n'));
    setWheelNames(nextNames);
    setStatusText(`${selectedName} removed from the wheel`);
    setSelectedName('');
    setWinnerModalOpen(false);
  };

  const resetAll = () => {
    if (isSpinning) {
      return;
    }

    setNamesText(DEFAULT_NAMES.join('\n'));
    setMode('single');
    setRotation(0);
    rotationRef.current = 0;
    setWheelNames(DEFAULT_NAMES);
    setSelectedName('');
    setWinnerModalOpen(false);
    setStatusText('Single user winner');
    setGroupSize(2);
    setGroups([]);
    setCopiedLabel('');
  };

  const handleWheelSpin = () => {
    if (mode === 'group') {
      createGroupsBySpin();
      return;
    }

    spinOne();
  };

  return (
    <main className="app-shell">
      <section className="top-bar">
        <div className="brand-block">
          <p className="brand-kicker">T-systems</p>
          <h1>IMedOne Spin the Wheel</h1>
        </div>

        <div className="manager-pill">
          <div className="manager-avatar">SS</div>
          <div>
            <p className="manager-name">{managerName}</p>
            <p className="manager-role">Manager</p>
          </div>
        </div>
      </section>

      <section className="main-layout">
        <aside className="side-card compact-card">
          <div className="card-head compact-head">
            <h2>Setup</h2>
          </div>

          <label className="field">
            <span>Members</span>
            <textarea
              rows="10"
              value={namesText}
              onChange={(event) => setNamesText(event.target.value)}
              placeholder="Add names with commas or new lines"
            />
          </label>

          <div className="members-cloud">
            {names.map((name) => (
              <span className="member-tag" key={name}>
                {name}
              </span>
            ))}
          </div>
        </aside>

        <section className="wheel-stage">
          <div className="top-controls">
            <div className="mode-switch">
              <button
                type="button"
                className={`mode-button ${mode === 'single' ? 'active' : ''}`}
                onClick={() => handleModeChange('single')}
              >
                Single winner
              </button>
              <button
                type="button"
                className={`mode-button ${mode === 'group' ? 'active' : ''}`}
                onClick={() => handleModeChange('group')}
              >
                Group
              </button>
            </div>
          </div>

          <p className="wheel-helper">Click the center to spin the wheel.</p>

          {mode === 'group' ? (
            <div className="club-toolbar">
              {[2, 4, 6].map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`club-button ${groupSize === size ? 'active' : ''}`}
                  onClick={() => setGroupSize(size)}
                >
                  Group by {size}
                </button>
              ))}
            </div>
          ) : null}

          <div className="wheel-wrap">
            <div className="pointer" aria-hidden="true" />
            <div className="wheel-frame" style={{ transform: `rotate(${rotation}deg)` }}>
              <canvas
                ref={canvasRef}
                className="wheel-canvas"
                width="720"
                height="720"
                aria-label="Spin wheel"
              />
            </div>
            <button
              type="button"
              className="wheel-center-button"
              onClick={handleWheelSpin}
              disabled={isSpinning}
              aria-label={mode === 'group' ? `Create groups by ${groupSize}` : 'Spin once'}
            >
              {isSpinning ? '...' : 'GO'}
            </button>
          </div>

          <div className="status-area" aria-live="polite">
            {statusText !== 'Single user winner' ? <p className="status-label">{statusText}</p> : null}
            <p className="picked-name">
              {selectedName || (mode === 'single' ? 'Single user winner' : 'Group creation')}
            </p>
          </div>

          <button
            type="button"
            className="spin-button tertiary reset-button"
            onClick={resetAll}
            disabled={isSpinning}
          >
            Reset
          </button>

        </section>

        <aside className="side-card compact-card">
          {mode === 'single' ? (
            <>
              <div className="card-head compact-head">
                <h2>Winner</h2>
                <p>The selected winner will open in a popup.</p>
              </div>
              <div className="single-help">
                <p className="empty-state">Use `Spin once` to pick one person.</p>
                <p className="empty-state">After the popup opens, you can remove that winner from the wheel.</p>
              </div>
            </>
          ) : (
            <>
              <div className="card-head compact-head">
                <h2>Groups</h2>
                <p>Click a group number to view its members.</p>
              </div>

              <div className="copy-row">
                <button
                  className="copy-all-button"
                  type="button"
                  onClick={copyAllGroups}
                  disabled={!groups.length}
                  aria-label="Copy groups"
                  title="Copy groups"
                >
                  ⧉
                </button>
                <span className="copy-helper">Copy</span>
                <span className="copy-feedback">{copiedLabel || 'Ready to copy'}</span>
              </div>

              <div className="groups-list">
                {groups.length ? (
                  groups.map((group, index) => (
                    <article className="group-card" key={`group-${index + 1}`}>
                      <div className="group-card-top">
                        <h3>Group {index + 1}</h3>
                      </div>
                      <div className="group-members">
                        {group.map((name) => (
                          <span className="group-member-chip" key={`${index + 1}-${name}`}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="empty-state">No groups yet. Choose Group mode and create them.</p>
                )}
              </div>
            </>
          )}
        </aside>
      </section>

      {winnerModalOpen ? (
        <div className="winner-modal-backdrop" role="presentation" onClick={() => setWinnerModalOpen(false)}>
          <div
            className="winner-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="winner-title"
            onClick={(event) => event.stopPropagation()}
          >
            <ConfettiBurst />
            <p className="winner-kicker">Winner</p>
            <h2 id="winner-title">{selectedName}</h2>
            <p className="winner-copy">Winner is {selectedName}</p>
            <div className="winner-actions">
              <button type="button" className="spin-button tertiary" onClick={() => setWinnerModalOpen(false)}>
                Close
              </button>
              <button type="button" className="spin-button" onClick={removeWinner}>
                Remove winner
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
