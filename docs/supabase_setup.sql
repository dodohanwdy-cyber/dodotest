-- 1. 기존에 생성된 모든 트리거, 함수, 테이블을 연쇄적으로(CASCADE) 삭제하여 초기화
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public."User_profiles" CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 2. 새 테이블 생성 (소문자 관례 적용)
CREATE TABLE public.user_profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text default 'client' not null,
  full_name text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Row Level Security (RLS) 설정
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "내 프로필만 조회 가능" 
  ON public.user_profiles FOR SELECT 
  USING ( auth.uid() = id );

CREATE POLICY "내 프로필만 수정 가능" 
  ON public.user_profiles FOR UPDATE 
  USING ( auth.uid() = id );

-- 4. 자동 프로필 생성 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 신규 가입 시 자동으로 user_profiles에 행 생성
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, 'client');
  RETURN new;
END;
$$;

-- 5. 트리거 연결
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
