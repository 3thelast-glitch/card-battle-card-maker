const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'apps/renderer/src/ui/layout/components/ui/CardFrame.tsx');
let code = fs.readFileSync(filePath, 'utf-8');

const startMarker = `if (layout === 'eldritch-eye') {`;
const endMarker = `if (layout === 'full-bleed') {`;

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error("Could not find markers!");
    process.exit(1);
}

const newBlock = `if (layout === 'eldritch-eye') {
		// ── Sub-components (defined inline to keep them co-located) ────────

		const StringLines = () => (
			<svg
				viewBox="0 0 350 480"
				style={{
					position: 'absolute',
					inset: 0,
					width: '100%',
					height: '100%',
					opacity: 0.18,
					zIndex: 1,
					pointerEvents: 'none',
				}}
			>
				{Array.from({ length: 15 }).map((_, i) => (
					<line
						key={\`v-\${i}\`}
						x1={i * 25}
						y1={0}
						x2={i * 25 + 10}
						y2={480}
						stroke="#fff"
						strokeWidth="0.5"
					/>
				))}
				{Array.from({ length: 20 }).map((_, i) => (
					<line
						key={\`h-\${i}\`}
						x1={0}
						y1={i * 25}
						x2={350}
						y2={i * 25 + 10}
						stroke="#ff0040"
						strokeWidth="0.3"
					/>
				))}
			</svg>
		);

		const OccultMandala = ({
			size,
			animClass,
			opacity = 0.35,
			isReverse = false,
		}: {
			size: number;
			animClass: string;
			opacity?: number;
			isReverse?: boolean;
		}) => (
			<svg
				className={animClass}
				viewBox="0 0 200 200"
				style={{
					position: 'absolute',
					width: size,
					height: size,
					opacity,
					pointerEvents: 'none',
					transformOrigin: 'center',
					animationDirection: isReverse ? 'reverse' : 'normal',
				}}
			>
				<circle
					cx="100"
					cy="100"
					r="95"
					fill="none"
					stroke="#8b0000"
					strokeWidth="2"
					strokeDasharray="4 8"
				/>
				<circle
					cx="100"
					cy="100"
					r="80"
					fill="none"
					stroke="#d94a4a"
					strokeWidth="1"
				/>
				<polygon
					points="100,10 180,150 20,150"
					fill="none"
					stroke="#8b0000"
					strokeWidth="1.5"
				/>
				<polygon
					points="100,190 20,50 180,50"
					fill="none"
					stroke="#8b0000"
					strokeWidth="1.5"
				/>
				<circle cx="100" cy="100" r="40" fill="none" stroke="#fff" strokeWidth="1" />
			</svg>
		);

		const CosmicEye = () => (
			<div
				style={{
					position: 'absolute',
					inset: 0,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					zIndex: 2,
					pointerEvents: 'none',
				}}
			>
				<OccultMandala size={300 * scale} animClass="animate-[spin_20s_linear_infinite]" opacity={0.2} />
				<OccultMandala
					size={220 * scale}
					animClass="animate-[spin_15s_linear_infinite]"
					opacity={0.3}
					isReverse
				/>
				<div
					style={{
						position: 'absolute',
						width: 120 * scale,
						height: 70 * scale,
						border: \`\${2 * scale}px solid #8b0000\`,
						borderRadius: '50%',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 0 30px rgba(139,0,0,0.6)',
						background: 'radial-gradient(ellipse at center, #2a0000 0%, transparent 70%)',
					}}
				>
					<div
						className="animate-pulse"
						style={{
							position: 'absolute',
							width: 70 * scale,
							height: 45 * scale,
							borderRadius: '50%',
							background: 'radial-gradient(circle at center, #ff0000 0%, #4a0000 100%)',
							boxShadow: '0 0 20px #ff0000',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
						}}
					>
						<div
							style={{
								width: 15 * scale,
								height: 35 * scale,
								background: '#000',
								borderRadius: '50%',
								transform: 'rotate(15deg)',
							}}
						/>
					</div>
				</div>
			</div>
		);

		const OrnateCorner = ({
			flipX,
			flipY,
		}: {
			flipX?: boolean;
			flipY?: boolean;
		}) => (
			<svg
				viewBox="0 0 60 60"
				style={{
					width: 48 * scale,
					height: 48 * scale,
					opacity: 0.8,
					transform: \`scaleX(\${flipX ? -1 : 1}) scaleY(\${flipY ? -1 : 1})\`,
					pointerEvents: 'none',
					flexShrink: 0,
				}}
			>
				<path
					d="M2,2 L58,2 L58,10 L10,10 L10,58 L2,58 Z"
					fill="#8b0000"
				/>
				<path
					d="M14,14 L40,14 L14,40 Z"
					fill="rgba(200,0,0,0.3)"
				/>
				<circle cx="10" cy="10" r="4" fill="#ff4d4d" />
				<path
					d="M14,2 L14,14 L2,14"
					stroke="rgba(255,100,100,0.8)"
					strokeWidth="1.5"
					fill="none"
				/>
			</svg>
		);

		const drips = [
			{ left: '18%', delay: '0s', height: 18 },
			{ left: '42%', delay: '1.3s', height: 22 },
			{ left: '67%', delay: '2.7s', height: 15 },
			{ left: '80%', delay: '0.6s', height: 20 },
		];

		const StatRing = ({
			color,
			reverse,
		}: {
			color: string;
			reverse?: boolean;
		}) => (
			<svg
				className={reverse ? 'animate-[spin_12s_linear_infinite_reverse]' : 'animate-[spin_12s_linear_infinite]'}
				viewBox="0 0 100 100"
				style={{
					position: 'absolute',
					inset: -4,
					width: 'calc(100% + 8px)',
					height: 'calc(100% + 8px)',
					pointerEvents: 'none',
					opacity: 0.8,
					animationDirection: reverse ? 'reverse' : 'normal',
				}}
			>
				<circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4 4" />
				<circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="2" strokeDasharray="15 5 5 5" opacity="0.5" />
			</svg>
		);

		return (
			<div
				className={\`transition-all duration-300 hover:scale-[1.02] hover:brightness-110 \${onClick ? 'cursor-pointer' : ''} \${className}\`}
				style={{
					width: 350 * scale,
					height: 480 * scale,
					borderRadius: 4 * scale,
					position: 'relative',
					overflow: 'hidden',
					cursor: onClick ? 'pointer' : 'default',
					userSelect: 'none',
					flexShrink: 0,
					background: 'linear-gradient(135deg, #000000 0%, #0C0008 100%)',
					border: \`\${2 * scale}px solid rgba(255,255,255,0.15)\`,
					boxShadow: showGlow
						? '0 50px 120px rgba(80,0,0,0.95), inset 0 0 60px rgba(50,0,0,0.5)'
						: 'none',
					...style,
				}}
				onClick={onClick}
			>
				{/* ── Background Elements ── */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						background: 'radial-gradient(ellipse at 50% 42%, #1a0000 0%, #0a0a00 40%, #000 100%)',
						zIndex: 0,
					}}
				/>
				<StringLines />

				{/* ── Art Layer OR Cosmic Eye fallback ── */}
				<div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
					<OccultMandala size={350 * scale} animClass="animate-spin-slow" opacity={0.15} />
				</div>
				{data.imageUrl ? (
					<div
						style={{
							position: 'absolute',
							inset: 0,
							zIndex: 2,
							backgroundImage: \`url(\${data.imageUrl})\`,
							backgroundSize: 'cover',
							backgroundPosition: 'center',
							opacity: 0.7,
							mixBlendMode: 'luminosity',
						}}
					/>
				) : (
					<CosmicEye />
				)}

				{/* ── Vignette & Blood Drips ── */}
				<div
					style={{
						position: 'absolute',
						inset: 0,
						zIndex: 3,
						background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.95) 100%)',
						pointerEvents: 'none',
					}}
				/>
				{drips.map((d, i) => (
					<div
						key={i}
						className={i === 0 ? 'animate-drip' : i === 1 ? 'animate-drip-delay' : 'animate-drip-delay-2'}
						style={{
							position: 'absolute',
							top: 0,
							left: d.left,
							width: 3 * scale,
							height: d.height * scale,
							background: 'linear-gradient(to bottom, #8b0000, #dc2626, rgba(180,0,0,0))',
							borderRadius: '0 0 50% 50%',
							animationDelay: d.delay,
							zIndex: 4,
						}}
					/>
				))}

				{/* ── Four Corners ── */}
				<div style={{ position: 'absolute', top: 4 * scale, left: 4 * scale, zIndex: 20 }}>
					<OrnateCorner />
				</div>
				<div style={{ position: 'absolute', top: 4 * scale, right: 4 * scale, zIndex: 20 }}>
					<OrnateCorner flipX />
				</div>
				<div style={{ position: 'absolute', bottom: 4 * scale, left: 4 * scale, zIndex: 20 }}>
					<OrnateCorner flipY />
				</div>
				<div style={{ position: 'absolute', bottom: 4 * scale, right: 4 * scale, zIndex: 20 }}>
					<OrnateCorner flipX flipY />
				</div>

				{/* ── Top Badges: Rarity & Element ── */}
				<DraggableBadge
					id="badge-rarity"
					x={14 * scale}
					y={14 * scale}
					isEditing={isTransformMode}
				>
					<div
						style={{
							background: 'linear-gradient(135deg, #111, #300)',
							border: \`\${1 * scale}px solid #8b0000\`,
							padding: \`\${4 * scale}px \${12 * scale}px\`,
							color: '#fff',
							fontSize: 10 * scale,
							fontWeight: 'bold',
							letterSpacing: 1,
							clipPath: 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
							boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
						}}
					>
						{rCfg.label}
					</div>
				</DraggableBadge>

				<DraggableBadge
					id="badge-element"
					x={350 * scale - 42 * scale} // right: 14 + 28 = 42
					y={14 * scale}
					isEditing={isTransformMode}
				>
					<div
						style={{
							width: 28 * scale,
							height: 28 * scale,
							borderRadius: '50%',
							background: elCfg.gradient || '#333',
							border: \`\${1.5 * scale}px solid rgba(255,255,255,0.4)\`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 14 * scale,
							boxShadow: '0 0 15px rgba(0,0,0,0.8)',
						}}
					>
						{elCfg.icon}
					</div>
				</DraggableBadge>

				{/* ── Content Container (Bottom) ── */}
				<div
					style={{
						position: 'absolute',
						bottom: 0,
						left: 0,
						right: 0,
						padding: \`\${0}px \${16 * scale}px \${16 * scale}px\`,
						zIndex: 30,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'flex-end',
						pointerEvents: 'none',
					}}
				>
					{/* Title */}
					<h1
						style={{
							margin: 0,
							fontSize: 22 * scale,
							fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
							fontWeight: 900,
							textAlign: 'center',
							color: '#fff',
							background: 'linear-gradient(to bottom, #ffffff, #ff8c8c)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							filter: 'drop-shadow(0 2px 4px #8b0000)',
							marginBottom: 8 * scale,
							letterSpacing: 1 * scale,
							lineHeight: 1.15,
						}}
					>
						{data.title || 'عين الهاوية'}
					</h1>

					{/* Description Box */}
					{showDescription && (
						<div
							style={{
								background: 'rgba(10, 0, 5, 0.75)',
								border: \`\${1 * scale}px solid #8b0000\`,
								borderRadius: 4 * scale,
								padding: 8 * scale,
								color: '#e2d4d4',
								fontSize: 11 * scale,
								fontFamily: "'Noto Kufi Arabic', Cairo, sans-serif",
								textAlign: 'center',
								fontWeight: 500,
								minHeight: 60 * scale,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								marginBottom: 40 * scale, // Make room for bottom stats + stars
								lineHeight: 1.4,
								boxShadow: 'inset 0 0 10px rgba(80,0,0,0.5)',
								pointerEvents: 'auto',
							}}
						>
							{data.description || 'تحدق العين في الهاوية فترى ما وراء الواقع...'}
						</div>
					)}
				</div>

				{/* ── Stars (Centered at bottom) ── */}
				<div
					style={{
						position: 'absolute',
						bottom: 24 * scale,
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 40,
						pointerEvents: 'none',
					}}
				>
					<StarRating stars={data.cost} scale={scale} />
				</div>

				{/* ── HP & ATK 88px Rings (Bottom Corners) ── */}
				{showStats && (
					<>
						{/* HP */}
						<DraggableBadge
							id="badge-health"
							x={-10 * scale}
							y={480 * scale - 98 * scale} // (480 - 88 - 10) -> 382.
							isEditing={isTransformMode}
						>
							<div
								style={{
									width: 88 * scale,
									height: 88 * scale,
									borderRadius: '50%',
									background: 'radial-gradient(circle at center, #300, #100)',
									border: \`\${2 * scale}px solid rgba(255,100,100,0.4)\`,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									boxShadow: '0 0 20px rgba(255,0,0,0.3)',
									position: 'relative'
								}}
							>
								<StatRing color="#ff4444" />
								<span style={{ fontSize: 20 * scale, marginBottom: -4 * scale }}>❤️</span>
								<span style={{ fontSize: 24 * scale, fontWeight: 900, color: '#ffaaaa', textShadow: '0 0 8px #f00', lineHeight: 1.1 }}>
									{data.hp ?? 0}
								</span>
							</div>
						</DraggableBadge>

						{/* ATK */}
						<DraggableBadge
							id="badge-attack"
							x={350 * scale - 78 * scale} // 350 - 88 + 10 = 272.
							y={480 * scale - 98 * scale}
							isEditing={isTransformMode}
						>
							<div
								style={{
									width: 88 * scale,
									height: 88 * scale,
									borderRadius: '50%',
									background: 'radial-gradient(circle at center, #203, #001)',
									border: \`\${2 * scale}px solid rgba(200,100,255,0.4)\`,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									boxShadow: '0 0 20px rgba(150,0,255,0.3)',
									position: 'relative'
								}}
							>
								<StatRing color="#cc66ff" reverse />
								<span style={{ fontSize: 20 * scale, marginBottom: -4 * scale }}>👁️</span>
								<span style={{ fontSize: 24 * scale, fontWeight: 900, color: '#eebbff', textShadow: '0 0 8px #a0f', lineHeight: 1.1 }}>
									{data.attack ?? 0}
								</span>
							</div>
						</DraggableBadge>
					</>
				)}
			</div>
		);
	}
\t\t`;

code = code.substring(0, startIdx) + newBlock + code.substring(endIdx);
fs.writeFileSync(filePath, code);
console.log('Successfully replaced Eldritch Eye layout block.');
