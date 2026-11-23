import { useEffect, useState } from 'react';
import { getAdminSettings, saveAdminSettings } from '../../api/client';
import Button from '../ui/Button';

const toInput = (value) => (value === null || value === undefined ? '' : String(value));
const toStored = (value) => (String(value).trim() === '' ? null : String(value).trim());

/**
 * Business settings. Unknown values stay blank and are clearly marked as
 * pending; the WhatsApp `verified` flag is not writable through the API.
 */
export default function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    phone: '',
    email: '',
    address: '',
    hours: '',
    catalogue: '',
    specialist: '',
    deliveryFee: '',
    deliveryNote: '',
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getAdminSettings()
      .then((data) => {
        if (!active) return;
        setSettings(data.settings);
        setForm({
          phone: toInput(data.settings.contact.phone),
          email: toInput(data.settings.contact.email),
          address: toInput(data.settings.contact.address),
          hours: toInput(data.settings.hours),
          catalogue: toInput(data.settings.whatsapp.catalogue),
          specialist: toInput(data.settings.whatsapp.specialist),
          deliveryFee: toInput(data.settings.delivery.fee),
          deliveryNote: toInput(data.settings.delivery.note),
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError('');
    setNotice('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const data = await saveAdminSettings({
        contact: {
          phone: toStored(form.phone),
          email: toStored(form.email),
          address: toStored(form.address),
        },
        hours: toStored(form.hours),
        whatsapp: {
          catalogue: form.catalogue.trim(),
          specialist: form.specialist.trim(),
        },
        delivery: {
          fee: form.deliveryFee.trim() === '' ? null : Number(form.deliveryFee),
          note: toStored(form.deliveryNote),
        },
      });
      setSettings(data.settings);
      setNotice('Settings saved. Blank fields remain unpublished rather than invented.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="admin-card">
        <h2>Settings</h2>
        {error ? <p className="admin-error" role="alert">{error}</p> : <p role="status">Loading settings…</p>}
      </div>
    );
  }

  return (
    <div className="admin-card">
      <h2>Settings</h2>
      <p className="admin-form__note">
        Only values the owner has supplied are stored. Leaving a field blank
        keeps it unpublished; no address, phone or opening hour is invented.
      </p>

      {error ? <p className="admin-error" role="alert">{error}</p> : null}
      {notice ? <p className="admin-form__note" role="status">{notice}</p> : null}

      <form className="admin-form" onSubmit={submit}>
        <div className="admin-form__grid">
          <label>Business phone<input value={form.phone} onChange={update('phone')} placeholder="Not supplied" /></label>
          <label>Business email<input type="email" value={form.email} onChange={update('email')} placeholder="Not supplied" /></label>
          <label>Customer service hours<input value={form.hours} onChange={update('hours')} placeholder="Not supplied" /></label>
          <label>Default delivery charge (NGN)<input type="number" min="0" value={form.deliveryFee} onChange={update('deliveryFee')} placeholder="Not confirmed" /></label>
        </div>
        <label>Business address<input value={form.address} onChange={update('address')} placeholder="Not supplied" /></label>
        <label>Delivery note<textarea rows="2" value={form.deliveryNote} onChange={update('deliveryNote')} placeholder="Not supplied" /></label>

        <h3>WhatsApp destinations</h3>
        <p className="admin-form__note">
          Both supplied links open catalogue views. The verification flag can
          only be confirmed by the owner outside this dashboard.
        </p>
        <label>Catalogue link<input value={form.catalogue} onChange={update('catalogue')} /></label>
        <label>Specialist / second catalogue link<input value={form.specialist} onChange={update('specialist')} /></label>
        <p className="admin-form__note">
          Verification status: <strong>{settings.whatsapp.verified ? 'Verified' : 'Pending verification'}</strong>
        </p>

        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
      </form>
    </div>
  );
}
