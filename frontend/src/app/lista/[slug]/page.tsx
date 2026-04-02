"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Product {
  id: string;
  name: string;
  price: number | null;
  imageUrl: string | null;
  url: string;
  category: string | null;
}

interface ListItem {
  id: string;
  quantity: number;
  priority: number;
  notes: string | null;
  reservations: Reservation[];
  product: Product;
}

interface Reservation {
  id: string;
  reservedBy: string;
  quantity: number;
}

interface BabyList {
  id: string;
  name: string;
  description: string | null;
  babyName: string | null;
  dueDate: string | null;
  slug: string;
  items: ListItem[];
  user: {
    name: string;
  };
}

function getReservedQuantity(reservations: Reservation[]): number {
  return reservations.reduce((sum, r) => sum + r.quantity, 0);
}

function ReservationModal({
  item,
  onClose,
  onSuccess,
}: {
  item: ListItem;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reserved = getReservedQuantity(item.reservations);
  const available = item.quantity - reserved;

  async function handleReserve() {
    if (!name.trim()) {
      setError("Molimo unesite vaše ime.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listItemId: item.id,
          reservedBy: name.trim(),
          quantity,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Greška pri rezervaciji.");
      }
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Greška pri rezervaciji.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <h3 className="text-xl font-semibold text-rose-800 mb-1">
          Rezerviraj poklon
        </h3>
        <p className="text-sm text-rose-400 mb-6">{item.product.name}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-rose-700 mb-1">
            Vaše ime
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Upišite vaše ime..."
            className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-rose-900 placeholder-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {available > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-rose-700 mb-1">
              Količina
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full border border-rose-200 rounded-xl px-4 py-2.5 text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {Array.from({ length: available }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-rose-200 text-rose-500 rounded-xl py-2.5 font-medium hover:bg-rose-50 transition-colors"
          >
            Odustani
          </button>
          <button
            onClick={handleReserve}
            disabled={loading}
            className="flex-1 bg-rose-400 hover:bg-rose-500 text-white rounded-xl py-2.5 font-medium transition-colors disabled:opacity-60"
          >
            {loading ? "Rezerviram..." : "Rezerviraj"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({
  item,
  onReserve,
}: {
  item: ListItem;
  onReserve: () => void;
}) {
  const reserved = getReservedQuantity(item.reservations);
  const available = item.quantity - reserved;
  const fullyReserved = available <= 0;

  const priorityLabel: Record<number, string> = {
    1: "Nisko",
    2: "Srednje",
    3: "Visoko",
  };
  const priorityColor: Record<number, string> = {
    1: "bg-sage-100 text-sage-700",
    2: "bg-amber-100 text-amber-700",
    3: "bg-rose-100 text-rose-600",
  };

  return (
    <div
      className={`group relative bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
        fullyReserved ? "opacity-70" : "cursor-pointer"
      }`}
      onClick={() => {
        if (!fullyReserved) {
          window.open(item.product.url, "_blank", "noopener,noreferrer");
        }
      }}
    >
      {/* Image */}
      <div className="relative h-48 bg-rose-50 overflow-hidden">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-rose-200">
            <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
        )}

        {/* Priority badge */}
        {item.priority > 0 && (
          <span
            className={`absolute top-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full ${
              priorityColor[item.priority] ||
              "bg-gray-100 text-gray-600"
            }`}
          >
            {priorityLabel[item.priority] || ""}
          </span>
        )}

        {/* Fully reserved overlay */}
        {fullyReserved && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-green-100 text-green-700 font-semibold px-4 py-1.5 rounded-full text-sm">
              ✓ Rezervirano
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-rose-900 leading-snug line-clamp-2 mb-1">
          {item.product.name}
        </h3>

        {item.product.price && (
          <p className="text-rose-500 font-semibold text-sm mb-2">
            {item.product.price.toFixed(2)} €
          </p>
        )}

        {item.notes && (
          <p className="text-xs text-rose-400 italic mb-3 line-clamp-2">
            {item.notes}
          </p>
        )}

        {/* Quantity info */}
        <div className="flex items-center justify-between text-xs text-rose-400 mb-3">
          <span>
            {reserved > 0
              ? `${reserved} od ${item.quantity} rezervirano`
              : `${item.quantity} kom`}
          </span>
          {item.product.category && (
            <span className="bg-rose-50 px-2 py-0.5 rounded-full">
              {item.product.category}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={item.product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-center text-xs font-medium border border-rose-200 text-rose-500 rounded-xl py-2 hover:bg-rose-50 transition-colors"
          >
            Pogledaj u shopu →
          </a>
          {!fullyReserved && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReserve();
              }}
              className="flex-1 text-xs font-medium bg-rose-400 hover:bg-rose-500 text-white rounded-xl py-2 transition-colors"
            >
              Rezerviraj
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SharedListPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [list, setList] = useState<BabyList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [successItem, setSuccessItem] = useState<string | null>(null);

  async function fetchList() {
    try {
      const res = await fetch(`${API_URL}/api/lists/slug/${slug}`);
      if (!res.ok) throw new Error("Lista nije pronađena.");
      const data = await res.json();
      setList(data);
    } catch {
      setError("Lista nije pronađena ili je uklonjena.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (slug) fetchList();
  }, [slug]);

  async function handleReservationSuccess() {
    if (selectedItem) setSuccessItem(selectedItem.id);
    setSelectedItem(null);
    await fetchList();
    setTimeout(() => setSuccessItem(null), 3000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-rose-400 text-lg animate-pulse">Učitavam listu...</div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🍼</div>
          <h1 className="text-xl font-semibold text-rose-800 mb-2">Ups!</h1>
          <p className="text-rose-500">{error || "Lista nije pronađena."}</p>
        </div>
      </div>
    );
  }

  const totalItems = list.items.length;
  const reservedItems = list.items.filter(
    (i) => getReservedQuantity(i.reservations) >= i.quantity
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-rose-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-rose-400 font-semibold text-lg">🍼 Bebina Lista</div>
          <div className="text-xs text-rose-400">
            {reservedItems} / {totalItems} rezervirano
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎀</div>
          <h1 className="text-3xl font-bold text-rose-800 mb-2">{list.name}</h1>
          {list.babyName && (
            <p className="text-rose-500 text-lg mb-1">
              za bebu <span className="font-semibold">{list.babyName}</span>
            </p>
          )}
          {list.dueDate && (
            <p className="text-rose-400 text-sm">
              Očekivani datum:{" "}
              {new Date(list.dueDate).toLocaleDateString("hr-HR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
          {list.description && (
            <p className="text-rose-500 mt-4 max-w-xl mx-auto leading-relaxed">
              {list.description}
            </p>
          )}
          <p className="text-rose-300 text-sm mt-2">
            Lista kreirana od: {list.user.name}
          </p>
        </div>

        {/* Success toast */}
        {successItem && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50 text-sm font-medium">
            ✓ Rezervacija uspješna! Hvala ti! 🎉
          </div>
        )}

        {/* Items grid */}
        {list.items.length === 0 ? (
          <div className="text-center py-20 text-rose-300">
            <div className="text-4xl mb-4">🛒</div>
            <p>Lista je trenutno prazna.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {list.items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onReserve={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Reservation modal */}
      {selectedItem && (
        <ReservationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
}
