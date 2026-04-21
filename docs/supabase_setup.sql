-- ==============================================================================
-- 1. user_profiles 테이블 생성
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'client' not null,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 2. Row Level Security (RLS) 설정
-- ==============================================================================
-- user_profiles 테이블에 대한 RLS 활성화
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Select(조회) 정책: 자신의 프로필만 조회 가능하도록 설정
CREATE POLICY "Users can view own profile."
  ON public.user_profiles FOR SELECT
  USING ( auth.uid() = id );

-- Update(수정) 정책: 자신의 프로필만 수정 가능하도록 설정
CREATE POLICY "Users can update own profile."
  ON public.user_profiles FOR UPDATE
  USING ( auth.uid() = id );

-- ==============================================================================
-- 3. Database Trigger (회원가입 자동 프로필 생성)
-- ==============================================================================
-- 새로운 회원이 가입하면(public.auth) 자동으로 user_profiles 테이블에 데이터를 넣어주는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role, full_name)
  VALUES (
    new.id,
    'client',
    new.raw_user_meta_data->>'full_name' --(선택사항) 회원가입 시 meta data로 준 이름
  );
  RETURN new;
END;
$$;

-- auth.users 테이블에 Insert가 발생할 때 위 함수를 실행하는 트리거
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
