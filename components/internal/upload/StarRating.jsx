'use client';

export default function StarRating({ value, onChange }) {
  const v = parseInt(value) || 0;
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= v ? 'filled' : ''} onClick={() => onChange(n)} style={{ cursor: 'pointer' }}>
          ★
        </span>
      ))}
    </div>
  );
}
