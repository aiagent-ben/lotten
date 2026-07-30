import { Metadata } from 'next';
import { ContentForm } from '../ContentForm';

export const metadata: Metadata = {
  title: 'New Content | Lotten Admin',
};

export const dynamic = 'force-dynamic';

export default function NewContentPage() {
  return <ContentForm isNew={true} />;
}