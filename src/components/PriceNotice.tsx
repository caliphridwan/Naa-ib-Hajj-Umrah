export function PriceNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-stone ${className}`}>
      Prices are shown in Nigerian Naira (NGN). Unless a package expressly states
      otherwise, the displayed amount should not be assumed to include every tax, optional service, visa-related fee or
      other travel expense. A Hajj place is only secured once our team has confirmed your booking in writing.
    </p>
  );
}
