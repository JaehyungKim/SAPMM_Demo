/** Scenario cards grouped by the scope-item map – used by the scenario menu and the customer page. */
import { Icon } from '@ui5/webcomponents-react';
import { groupByCatalog } from '../scenarios/catalog';
import type { ScenarioDef } from '../scenarios/types';

function Card({ def, current, onPick }: { def: ScenarioDef; current: boolean; onPick: () => void }) {
  const rt = def.useRuntime();
  const done = def.steps.filter((st) => st.id !== 'launchpad' && rt.done(st.id)).length;
  const total = def.steps.length - 1;
  return (
    <button className={`smenu-card ${current ? 'cur' : ''}`} onClick={onPick} title={def.summary}>
      <span className="smenu-code">{def.code}</span>
      <span className="smenu-txt">
        <b>{def.title}</b>
        <small className="smenu-en">{def.titleEn}</small>
        <span className="smenu-prog"><i style={{ width: `${(done / total) * 100}%` }} /></span>
        <small>{done} / {total} 단계 완료</small>
      </span>
      {current ? <span className="smenu-cur">진행 중</span> : <Icon name="navigation-right-arrow" />}
    </button>
  );
}

export function ScenarioGrid({ list, current, onPick }: { list: ScenarioDef[]; current?: string; onPick: (d: ScenarioDef) => void }) {
  return (
    <div className="smenu-cols">
      {groupByCatalog(list).map(({ group, items }) => (
        <section key={group.id} className={`smenu-col ${items.length > 3 ? 'wide' : ''}`}>
          <h3 className="smenu-cat">{group.title}<small>{group.titleKo}</small></h3>
          <div className="smenu-list">
            {items.map((d) => <Card key={d.id} def={d} current={d.id === current} onPick={() => onPick(d)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
