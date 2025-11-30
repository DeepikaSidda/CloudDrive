import { FiChevronRight } from 'react-icons/fi';
import { BreadcrumbItem } from '../types';

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onItemClick: (index: number) => void;
}

export default function Breadcrumb({ items, onItemClick }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center">
          {index > 0 && <FiChevronRight className="mx-2 text-gray-400" />}
          <button
            onClick={() => onItemClick(index)}
            className={`hover:text-blue-600 transition ${
              index === items.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'
            }`}
          >
            {item.name}
          </button>
        </div>
      ))}
    </nav>
  );
}
