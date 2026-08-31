import { Layers } from 'lucide-react';

export type CategoryFilterKey =
  | 'all'
  | 'metal'
  | 'metalloid'
  | 'nonmetal'
  | 'alkali_metal'
  | 'alkaline_earth'
  | 'transition_metal'
  | 'post_transition_metal'
  | 'lanthanide'
  | 'actinide'
  | 'halogen'
  | 'noble_gas';

interface CategoryLegendProps {
  selectedCategory: CategoryFilterKey;
  onSelectCategory: (key: CategoryFilterKey) => void;
}

const CATEGORY_ITEMS: Array<{ key: CategoryFilterKey; label: string; group: 'class' | 'family'; dotClass: string }> = [
  { key: 'all', label: 'Todos', group: 'class', dotClass: 'dot-all' },
  { key: 'metal', label: 'Metales', group: 'class', dotClass: 'dot-metal' },
  { key: 'metalloid', label: 'Metaloides', group: 'class', dotClass: 'dot-metalloid' },
  { key: 'nonmetal', label: 'No metales', group: 'class', dotClass: 'dot-nonmetal' },

  { key: 'alkali_metal', label: 'Alcalinos', group: 'family', dotClass: 'cat-alkali-metal' },
  { key: 'alkaline_earth', label: 'Alcalinotérreos', group: 'family', dotClass: 'cat-alkaline-earth' },
  { key: 'transition_metal', label: 'Transición', group: 'family', dotClass: 'cat-transition-metal' },
  { key: 'post_transition_metal', label: 'Post-transición', group: 'family', dotClass: 'cat-post-transition-metal' },
  { key: 'lanthanide', label: 'Lantánidos', group: 'family', dotClass: 'cat-lanthanide' },
  { key: 'actinide', label: 'Actínidos', group: 'family', dotClass: 'cat-actinide' },
  { key: 'halogen', label: 'Halógenos', group: 'family', dotClass: 'cat-halogen' },
  { key: 'noble_gas', label: 'Gases nobles', group: 'family', dotClass: 'cat-noble-gas' },
];

export function CategoryLegend({ selectedCategory, onSelectCategory }: CategoryLegendProps) {
  return (
    <div className="category-legend-bar" aria-label="Leyenda y filtro de categorías químicas">
      <div className="legend-header">
        <Layers size={14} />
        <span>Filtrar por clasificación:</span>
      </div>
      <div className="legend-chips">
        {CATEGORY_ITEMS.map((item) => {
          const isActive = selectedCategory === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`legend-chip ${item.group === 'class' ? 'is-class' : 'is-family'} ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectCategory(isActive ? 'all' : item.key)}
              aria-pressed={isActive}
              title={`Filtrar elementos por ${item.label}`}
            >
              <span className={`chip-dot ${item.dotClass}`} />
              <span className="chip-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
