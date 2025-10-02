import SignInWithGoogle from '../components/Auth/SignInWithGoogle';
import { Welcome } from '../components/Welcome/Welcome';

export default function HomePage() {
  return (
    <>
      <Welcome />
      <SignInWithGoogle />
    </>
  );
}
