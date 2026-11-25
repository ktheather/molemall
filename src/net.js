// PeerJS(WebRTC) 기반 2인 연결. 호스트가 권위(상태 소유), 게스트는 액션만 보낸다.
// 방 코드 → PeerJS id 로 변환해서 별도 서버 없이 붙는다 (PeerJS 공용 시그널링 서버 사용).
const PREFIX = 'molemall-v1-';
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), n => CODE_CHARS[n % CODE_CHARS.length]).join('');

function newPeer(id) {
  return new Peer(id, { debug: 1 });
}

// 호스트: 방을 열고 게스트 1명을 기다린다
export function host(code, { onOpen, onGuest, onMessage, onClose, onError }) {
  const peer = newPeer(PREFIX + code);
  let conn = null;
  peer.on('open', () => onOpen?.(code));
  peer.on('connection', c => {
    if (conn) { c.close(); return; } // 2인 게임: 추가 접속 거절
    conn = c;
    c.on('open', () => onGuest?.(c));
    c.on('data', d => onMessage?.(d));
    c.on('close', () => { conn = null; onClose?.(); });
  });
  peer.on('error', e => onError?.(e));
  return { send: d => conn?.open && conn.send(d), close: () => peer.destroy() };
}

// 게스트: 방 코드로 호스트에 붙는다
export function join(code, { onOpen, onMessage, onClose, onError }) {
  const peer = newPeer(undefined);
  let conn = null;
  peer.on('open', () => {
    conn = peer.connect(PREFIX + code.toUpperCase(), { reliable: true });
    conn.on('open', () => onOpen?.(conn));
    conn.on('data', d => onMessage?.(d));
    conn.on('close', () => onClose?.());
    conn.on('error', e => onError?.(e));
  });
  peer.on('error', e => onError?.(e));
  return { send: d => conn?.open && conn.send(d), close: () => peer.destroy() };
}
