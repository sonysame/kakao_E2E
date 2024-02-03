#include <stdio.h>
#include <stdlib.h>
#include "gmp.h"
#include <time.h>

FILE * fp;

clock_t elapsed;

float sec;
#define START_WATCH \
{\
elapsed = -clock(); \
}\


#define STOP_WATCH \
{\
elapsed += clock(); \
sec = (float)elapsed / CLOCKS_PER_SEC; \
}\

#define PRINT_TIME(qstr) \
{\
printf("\n[%s: %.5f s]\n", qstr, sec); \
}\

void RSA_speed_test(int RSA_SIZE, gmp_randstate_t state) {
	//RSA Key Generation
	//공개키 : n, e
	//비밀키 : p,q,d
	mpz_t n,r2, e, p, q, d, r;
	mpz_t m, c, tmp;
//	int RSA_SIZE;
	int mr_itr;
	//gmp_randstate_t state;

	mpz_init(n);
	mpz_init(r2);
	mpz_init(e);
	mpz_init(p);
	mpz_init(q);
	mpz_init(d);
	mpz_init(m);
	mpz_init(c);
	mpz_init(r);
	mpz_init(tmp);
	gmp_randinit_default(state);
	
	//RSA_SIZE = 2048;
	if (RSA_SIZE == 1024) mr_itr = 40;
	else if (RSA_SIZE == 2048) mr_itr = 56;
	else if (RSA_SIZE == 3072) mr_itr = 64;
	else if (RSA_SIZE == 4096) mr_itr = 96;
	// e=2^16+1=0x10001

	e->_mp_d[0] = 0x10001;
	e->_mp_size = 1;
	//위 두 줄 대신 set_str이용해줄수도 있다!
	//mpz_set_str(e, "10001", 16);
	
	
	// p 생성 : 난수생성 -> 소수판정
	START_WATCH;
	while (1)
	{
		mpz_urandomb(p, state, (RSA_SIZE>>1));
		p->_mp_d[mpz_size(p)-1] |= 0x80000000;
		p->_mp_d[0] |= 0x00000001;
		if (mpz_probab_prime_p(p, mr_itr)) {
			int k = (p->_mp_d[0]) % 100;
			if (k % 4 == 3)break;
		}
	}
	STOP_WATCH;
	PRINT_TIME("p generate");

	// q 생성 : 난수생성 -> 소수판정
	START_WATCH;
	while (1)
	{
		mpz_urandomb(q, state, (RSA_SIZE >> 1));
		q->_mp_d[mpz_size(q) - 1] |= 0x80000000;
		q->_mp_d[0] |= 0x00000001;
		if (mpz_probab_prime_p(q, mr_itr)) {
			int k = (q->_mp_d[0]) % 100;
			if (k % 4 == 3)break;
		}
	}
	STOP_WATCH;
	PRINT_TIME("q generate");
	
	// n 생성 : n=p*q
	mpz_mul(n, p, q);
	
	// r 생성 : 난수생성 -> n과 서로소
	START_WATCH;
	while (1)
	{
		mpz_urandomb(r, state, (RSA_SIZE >> 1));
		mpz_gcd(tmp, r, n);
		if ((tmp->_mp_size == 1) && (tmp->_mp_d[0] == 1))break;
	}
	STOP_WATCH;
	PRINT_TIME("r generate");
	
	while(1){
		int random_number = 0;
		for (int j = 0; j < 8; j++) {
			mpz_mul(r2, r, r);
			mpz_mod(r, r2, n);
			random_number += ((r->_mp_d[0]) % 2) << j;
		}
		fp = fopen("./random_number.txt", "wt");
		if (fp != NULL) {
			//printf("random_number : %d\n", random_number);
			fprintf(fp, "random_number : %d\n", random_number);
			fclose(fp);
		}

	}
	//실제로는 0으로 초기화시킨후 clear
	mpz_clear(n);
	mpz_clear(e);
	mpz_clear(p);
	mpz_clear(q);
	mpz_clear(d);
	mpz_clear(m);
	mpz_clear(c);
	mpz_clear(tmp);
	mpz_clear(r);
	mpz_clear(r2);
}

void main() {

	gmp_randstate_t state;
	gmp_randinit_default(state);
	
	//printf("1024\n");
	//RSA_speed_test(1024,state);
	//printf("=========================================\n\n");
	//printf("2048\n");
	RSA_speed_test(2048,state);
	return 0;
	//printf("=========================================\n\n");
	//printf("3072\n");
	//RSA_speed_test(3072,state);
	//printf("=========================================\n\n");
	//printf("4096\n");
	//RSA_speed_test(4096,state);
	//printf("=========================================\n\n");

}