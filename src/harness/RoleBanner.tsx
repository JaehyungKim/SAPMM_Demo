/** "⚡ 역할 전환 중" banner shown when the next step belongs to another business role. */
import { useEffect, useRef, useState } from 'react';
import { ROLE_KO, ROLE_USER, type Role } from '../steps';

export function RoleBanner({ role }: { stepId: string; role: Role }) {
  const prev = useRef(role);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (prev.current !== role) {
      prev.current = role;
      setShow(true);
      const t = setTimeout(() => setShow(false), 2800);
      return () => clearTimeout(t);
    }
  }, [role]);
  if (!show) return null;
  return (
    <div className="role-banner">
      ⚡ 역할 전환 중: <b>{ROLE_KO[role]}</b> <span>({ROLE_USER[role].roleId})</span>
    </div>
  );
}
