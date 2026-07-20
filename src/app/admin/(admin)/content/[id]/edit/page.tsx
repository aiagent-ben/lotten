import { Metadata } from 'next';
import { ContentForm } from '../../ContentForm';

export const metadata: Metadata = {
  title: 'Edit Content | Lotten Admin',
};

export default function EditContentPage() {
  return <ContentForm isNew={false} />;
}